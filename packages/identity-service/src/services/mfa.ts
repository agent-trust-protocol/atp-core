import { ATPMFAService, MFASecretKey, MFAVerificationResult } from '@atp/shared';
import { Pool } from 'pg';

export interface MFASetupRequest {
  did: string;
  accountName: string;
  method: 'totp' | 'hardware';
}

export interface MFAVerificationRequest {
  did: string;
  token?: string;
  backupCode?: string;
  hardwareResponse?: {
    signature: string;
    challenge: string;
  };
}

export interface MFAStatus {
  enabled: boolean;
  methods: string[];
  backupCodesRemaining: number;
  lastUsed?: Date;
  strength: number;
}

export class IdentityMFAService {
  private mfaService: ATPMFAService;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
    this.mfaService = new ATPMFAService({
      issuer: 'Agent Trust Protocol™ Identity Service',
      period: 30,
      digits: 6,
      window: 1
    });
  }

  /**
   * Setup MFA for a DID
   */
  async setupMFA(request: MFASetupRequest): Promise<MFASecretKey | null> {
    const client = await this.db.connect();
    
    try {
      // Check if DID exists and is verified
      const didResult = await client.query(
        'SELECT id, trust_level FROM atp_identity.agents WHERE did = $1 AND status = $2',
        [request.did, 'active']
      );

      if (didResult.rows.length === 0) {
        throw new Error('DID not found or not active');
      }

      // Check if MFA is already setup
      const mfaResult = await client.query(
        'SELECT id FROM atp_identity.mfa_configs WHERE did = $1 AND status = $2',
        [request.did, 'active']
      );

      if (mfaResult.rows.length > 0) {
        throw new Error('MFA already configured for this DID');
      }

      if (request.method === 'totp') {
        // Generate TOTP secret
        const secretKey = this.mfaService.generateSecretKey(request.accountName, request.did);
        
        // Store MFA configuration (secret will be confirmed later)
        await client.query(`
          INSERT INTO atp_identity.mfa_configs (
            did, method, secret_encrypted, backup_codes_encrypted, 
            qr_code, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          request.did,
          'totp',
          this.encryptSecret(secretKey.secret),
          JSON.stringify(this.mfaService.encryptBackupCodes(secretKey.backupCodes)),
          secretKey.qrCode,
          'pending'
        ]);

        return secretKey;
      } else if (request.method === 'hardware') {
        // Hardware key setup would require WebAuthn challenge/response
        const challenge = this.mfaService.generateHardwareKeyChallenge(
          `${request.did}-hardware`,
          'atp.protocol.identity'
        );

        await client.query(`
          INSERT INTO atp_identity.mfa_configs (
            did, method, hardware_challenge, status, created_at
          ) VALUES ($1, $2, $3, $4, NOW())
        `, [
          request.did,
          'hardware',
          JSON.stringify(challenge),
          'pending'
        ]);

        return {
          secret: challenge.challenge,
          qrCode: '', // Not applicable for hardware keys
          backupCodes: [] // Hardware keys don't use backup codes
        };
      }

      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm MFA setup with verification
   */
  async confirmMFASetup(did: string, verificationToken: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get pending MFA configuration
      const mfaResult = await client.query(
        'SELECT id, method, secret_encrypted FROM atp_identity.mfa_configs WHERE did = $1 AND status = $2',
        [did, 'pending']
      );

      if (mfaResult.rows.length === 0) {
        return false;
      }

      const mfaConfig = mfaResult.rows[0];
      
      if (mfaConfig.method === 'totp') {
        const secret = this.decryptSecret(mfaConfig.secret_encrypted);
        const isValid = this.mfaService.validateMFASetup(secret, verificationToken);

        if (isValid) {
          // Activate MFA configuration
          await client.query(
            'UPDATE atp_identity.mfa_configs SET status = $1, confirmed_at = NOW() WHERE id = $2',
            ['active', mfaConfig.id]
          );

          // Update agent trust level
          await client.query(`
            UPDATE atp_identity.agents 
            SET trust_level = CASE 
              WHEN trust_level = 'BASIC' THEN 'VERIFIED'
              WHEN trust_level = 'VERIFIED' THEN 'TRUSTED'
              ELSE trust_level
            END,
            updated_at = NOW()
            WHERE did = $1
          `, [did]);

          await client.query('COMMIT');
          return true;
        }
      }

      await client.query('ROLLBACK');
      return false;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify MFA during authentication
   */
  async verifyMFA(request: MFAVerificationRequest): Promise<MFAVerificationResult> {
    const client = await this.db.connect();
    
    try {
      // Get active MFA configuration
      const mfaResult = await client.query(`
        SELECT id, method, secret_encrypted, backup_codes_encrypted, 
               hardware_public_key, last_used_at
        FROM atp_identity.mfa_configs 
        WHERE did = $1 AND status = $2
      `, [request.did, 'active']);

      if (mfaResult.rows.length === 0) {
        return { valid: false };
      }

      const mfaConfig = mfaResult.rows[0];
      let result: MFAVerificationResult = { valid: false };

      if (request.token && mfaConfig.method === 'totp') {
        // Verify TOTP token
        const secret = this.decryptSecret(mfaConfig.secret_encrypted);
        result = this.mfaService.verifyTOTP(request.token, secret);
      } else if (request.backupCode && mfaConfig.backup_codes_encrypted) {
        // Verify backup code
        const backupCodes = JSON.parse(mfaConfig.backup_codes_encrypted);
        result = this.mfaService.verifyBackupCode(request.backupCode, backupCodes);
        
        if (result.valid) {
          // Remove used backup code
          const updatedCodes = backupCodes.filter((code: string) => {
            try {
              const decrypted = this.mfaService.verifyBackupCode(request.backupCode!, [code]);
              return !decrypted.valid;
            } catch {
              return true;
            }
          });

          await client.query(
            'UPDATE atp_identity.mfa_configs SET backup_codes_encrypted = $1 WHERE id = $2',
            [JSON.stringify(updatedCodes), mfaConfig.id]
          );
        }
      } else if (request.hardwareResponse && mfaConfig.method === 'hardware') {
        // Verify hardware key response
        result = await this.mfaService.verifyHardwareKeyResponse(
          JSON.parse(request.hardwareResponse.challenge),
          request.hardwareResponse.signature,
          mfaConfig.hardware_public_key
        );
      }

      if (result.valid) {
        // Update last used timestamp
        await client.query(
          'UPDATE atp_identity.mfa_configs SET last_used_at = NOW() WHERE id = $1',
          [mfaConfig.id]
        );

        // Log successful MFA verification
        await this.logMFAEvent(request.did, 'verification_success', result.method || 'unknown');
      } else {
        // Log failed MFA attempt
        await this.logMFAEvent(request.did, 'verification_failed', 'unknown');
      }

      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Get MFA status for a DID
   */
  async getMFAStatus(did: string): Promise<MFAStatus> {
    const client = await this.db.connect();
    
    try {
      const result = await client.query(`
        SELECT method, backup_codes_encrypted, last_used_at, created_at
        FROM atp_identity.mfa_configs 
        WHERE did = $1 AND status = $2
      `, [did, 'active']);

      if (result.rows.length === 0) {
        return {
          enabled: false,
          methods: [],
          backupCodesRemaining: 0,
          strength: 0
        };
      }

      const config = result.rows[0];
      const methods = [config.method];
      let backupCodesRemaining = 0;

      if (config.backup_codes_encrypted) {
        try {
          const backupCodes = JSON.parse(config.backup_codes_encrypted);
          backupCodesRemaining = backupCodes.length;
          if (backupCodesRemaining > 0) {
            methods.push('backup');
          }
        } catch {
          backupCodesRemaining = 0;
        }
      }

      const strength = this.mfaService.getMFAStrength(methods);

      return {
        enabled: true,
        methods,
        backupCodesRemaining,
        lastUsed: config.last_used_at,
        strength
      };
    } finally {
      client.release();
    }
  }

  /**
   * Disable MFA for a DID (with proper verification)
   */
  async disableMFA(did: string, verificationToken: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      // First verify current MFA
      const verifyResult = await this.verifyMFA({ did, token: verificationToken });
      
      if (!verifyResult.valid) {
        return false;
      }

      await client.query('BEGIN');

      // Disable MFA configuration
      await client.query(
        'UPDATE atp_identity.mfa_configs SET status = $1, disabled_at = NOW() WHERE did = $2 AND status = $3',
        ['disabled', did, 'active']
      );

      // Potentially adjust trust level
      await client.query(`
        UPDATE atp_identity.agents 
        SET trust_level = CASE 
          WHEN trust_level = 'TRUSTED' THEN 'VERIFIED'
          WHEN trust_level = 'VERIFIED' THEN 'BASIC'
          ELSE trust_level
        END,
        updated_at = NOW()
        WHERE did = $1
      `, [did]);

      await this.logMFAEvent(did, 'mfa_disabled', 'admin');

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(did: string, verificationToken: string): Promise<string[] | null> {
    const verifyResult = await this.verifyMFA({ did, token: verificationToken });
    
    if (!verifyResult.valid) {
      return null;
    }

    const client = await this.db.connect();
    
    try {
      const newSecretKey = this.mfaService.generateSecretKey('backup-regen', did);
      const encryptedCodes = this.mfaService.encryptBackupCodes(newSecretKey.backupCodes);

      await client.query(
        'UPDATE atp_identity.mfa_configs SET backup_codes_encrypted = $1 WHERE did = $2 AND status = $3',
        [JSON.stringify(encryptedCodes), did, 'active']
      );

      await this.logMFAEvent(did, 'backup_codes_regenerated', 'user');

      return newSecretKey.backupCodes;
    } finally {
      client.release();
    }
  }

  /**
   * Log MFA-related events for audit
   */
  private async logMFAEvent(did: string, action: string, method: string): Promise<void> {
    // This would integrate with the audit logger service
    // For now, we'll log to the database
    const client = await this.db.connect();
    
    try {
      await client.query(`
        INSERT INTO atp_identity.mfa_audit_log (
          did, action, method, timestamp, ip_address
        ) VALUES ($1, $2, $3, NOW(), $4)
      `, [did, action, method, 'unknown']); // IP would come from request context
    } catch (error) {
      console.warn('Failed to log MFA event:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Encrypt MFA secret for storage
   */
  private encryptSecret(secret: string): string {
    // Use the shared encryption service
    const { ATPEncryptionService } = require('@atp/shared');
    return ATPEncryptionService.encrypt(secret);
  }

  /**
   * Decrypt MFA secret from storage
   */
  private decryptSecret(encryptedSecret: string): string {
    const { ATPEncryptionService } = require('@atp/shared');
    return ATPEncryptionService.decrypt(encryptedSecret);
  }
}
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { encode as base32Encode, decode as base32Decode } from 'hi-base32';
import { ATPEncryptionService } from '../encryption.js';

export interface MFASecretKey {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  valid: boolean;
  used?: boolean;
  timeSlice?: number;
  method?: 'totp' | 'backup' | 'hardware';
}

export interface MFAConfig {
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  window: number;
}

export interface HardwareKeyChallenge {
  challenge: string;
  keyHandle: string;
  appId: string;
}

export class ATPMFAService {
  private static readonly DEFAULT_CONFIG: MFAConfig = {
    issuer: 'Agent Trust Protocol™',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    window: 1
  };

  private config: MFAConfig;
  private usedTokens: Set<string> = new Set();

  constructor(config: Partial<MFAConfig> = {}) {
    this.config = { ...ATPMFAService.DEFAULT_CONFIG, ...config };
    
    // Cleanup used tokens every hour
    setInterval(() => {
      this.usedTokens.clear();
    }, 60 * 60 * 1000);
  }

  /**
   * Generate a new TOTP secret for MFA setup
   */
  generateSecretKey(accountName: string, did?: string): MFASecretKey {
    const secret = this.generateSecret();
    const label = did ? `${accountName} (${did})` : accountName;
    const qrCode = this.generateQRCodeURL(secret, label);
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      qrCode,
      backupCodes
    };
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(token: string, secret: string, allowReplay: boolean = false): MFAVerificationResult {
    if (!token || !secret) {
      return { valid: false };
    }

    const cleanToken = token.replace(/\s/g, '');
    if (cleanToken.length !== this.config.digits) {
      return { valid: false };
    }

    // Check for replay attacks
    const tokenKey = `${secret}:${cleanToken}`;
    if (!allowReplay && this.usedTokens.has(tokenKey)) {
      return { valid: false, used: true };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeSlice = Math.floor(currentTime / this.config.period);

    // Check current and adjacent time windows
    for (let i = -this.config.window; i <= this.config.window; i++) {
      const expectedToken = this.generateTOTP(secret, timeSlice + i);
      
      if (timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedToken))) {
        // Mark token as used
        if (!allowReplay) {
          this.usedTokens.add(tokenKey);
        }
        
        return {
          valid: true,
          timeSlice: timeSlice + i,
          method: 'totp'
        };
      }
    }

    return { valid: false };
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(inputCode: string, encryptedBackupCodes: string[]): MFAVerificationResult {
    if (!inputCode || !encryptedBackupCodes.length) {
      return { valid: false };
    }

    const cleanCode = inputCode.replace(/\s/g, '').toLowerCase();

    for (const encryptedCode of encryptedBackupCodes) {
      try {
        // For now, skip encryption - this needs proper key management
        const decryptedCode = typeof encryptedCode === 'string' ? encryptedCode : JSON.stringify(encryptedCode);
        
        if (timingSafeEqual(Buffer.from(cleanCode), Buffer.from(decryptedCode))) {
          return {
            valid: true,
            method: 'backup'
          };
        }
      } catch (error) {
        // Invalid encrypted backup code, continue to next
        continue;
      }
    }

    return { valid: false };
  }

  /**
   * Generate hardware key challenge for FIDO2/WebAuthn
   */
  generateHardwareKeyChallenge(keyId: string, appId: string): HardwareKeyChallenge {
    const challenge = randomBytes(32).toString('base64url');
    
    return {
      challenge,
      keyHandle: keyId,
      appId
    };
  }

  /**
   * Verify hardware key response
   */
  async verifyHardwareKeyResponse(
    challenge: HardwareKeyChallenge,
    signature: string,
    publicKey: string
  ): Promise<MFAVerificationResult> {
    try {
      // In a real implementation, this would verify the WebAuthn/FIDO2 signature
      // For now, we'll implement a simplified verification
      
      const challengeHash = createHmac('sha256', challenge.challenge)
        .update(challenge.keyHandle)
        .update(challenge.appId)
        .digest();

      // Verify signature against challenge (simplified)
      const isValid = await this.verifyECDSASignature(challengeHash, signature, publicKey);

      return {
        valid: isValid,
        method: 'hardware'
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Generate TOTP token for given secret and time slice
   */
  private generateTOTP(secret: string, timeSlice: number): string {
    const key = base32Decode(secret.replace(/\s/g, '').toUpperCase());
    const time = Buffer.alloc(8);
    time.writeUInt32BE(Math.floor(timeSlice / 0x100000000), 0);
    time.writeUInt32BE(timeSlice & 0xffffffff, 4);

    const hmac = createHmac('sha1', key);
    hmac.update(time);
    const hash = hmac.digest();

    const offset = hash[19] & 0xf;
    const code = (hash.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, this.config.digits);

    return code.toString().padStart(this.config.digits, '0');
  }

  /**
   * Generate cryptographically secure secret
   */
  private generateSecret(): string {
    const buffer = randomBytes(20);
    return base32Encode(buffer).replace(/=/g, '');
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  private generateQRCodeURL(secret: string, label: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits.toString(),
      period: this.config.period.toString()
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  /**
   * Generate backup codes for account recovery
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').match(/.{1,4}/g)?.join('-') || '';
      codes.push(code);
    }

    return codes;
  }

  /**
   * Simplified ECDSA signature verification (placeholder)
   */
  private async verifyECDSASignature(
    data: Buffer,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    // This is a placeholder for actual ECDSA verification
    // In production, use a proper cryptographic library like @noble/secp256k1
    try {
      const sigBuffer = Buffer.from(signature, 'base64');
      const keyBuffer = Buffer.from(publicKey, 'base64');
      
      // Simplified validation - in practice, use proper ECDSA verification
      return sigBuffer.length >= 64 && keyBuffer.length >= 32;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt backup codes for secure storage
   */
  encryptBackupCodes(backupCodes: string[]): string[] {
    // For now, return codes directly - proper encryption needs key management
    return backupCodes;
  }

  /**
   * Validate MFA setup completeness
   */
  validateMFASetup(secret: string, testToken: string): boolean {
    const result = this.verifyTOTP(testToken, secret, true);
    return result.valid;
  }

  /**
   * Generate recovery information for MFA reset
   */
  generateRecoveryInfo(did: string, secret: string): string {
    const recoveryData = {
      did,
      timestamp: Date.now(),
      secretHash: createHmac('sha256', 'atp-recovery-salt').update(secret).digest('hex')
    };

    // For now, return base64 encoded - proper encryption needs key management
    return Buffer.from(JSON.stringify(recoveryData)).toString('base64');
  }

  /**
   * Get MFA strength score based on enabled methods
   */
  getMFAStrength(enabledMethods: string[]): number {
    let score = 0;
    
    if (enabledMethods.includes('totp')) score += 0.4;
    if (enabledMethods.includes('backup')) score += 0.2;
    if (enabledMethods.includes('hardware')) score += 0.4;
    
    return Math.min(score, 1.0);
  }

  /**
   * Clean up expired tokens and challenges
   */
  cleanup(): void {
    this.usedTokens.clear();
  }
}
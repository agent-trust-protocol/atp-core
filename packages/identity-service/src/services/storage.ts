import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { DIDDocument, KeyPair } from '../models/did.js';
import { CryptoUtils } from '../utils/crypto.js';
import { encryptionService } from '@atp/shared/dist/security/encryption.js';

export class StorageService extends BaseStorage {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Tables are created by init-db.sql, just verify connection
  }

  async storeDIDDocument(document: DIDDocument): Promise<void> {
    const query = `
      INSERT INTO atp_identity.did_documents (did, document, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (did) DO UPDATE SET
        document = EXCLUDED.document,
        updated_at = EXCLUDED.updated_at
    `;
    
    await this.db.query(query, [
      document.id,
      this.safeJsonStringify(document),
      this.toISOString(document.created),
      this.toISOString(document.updated)
    ]);
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const query = 'SELECT document FROM atp_identity.did_documents WHERE did = $1';
    const result = await this.db.query(query, [did]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // PostgreSQL JSONB returns objects directly, not JSON strings
    const document = result.rows[0].document;
    return typeof document === 'string' ? this.safeJsonParse<DIDDocument>(document) : document as DIDDocument;
  }

  async storeKeyPair(keyPair: KeyPair): Promise<void> {
    // Store public key in agents table, private key needs separate secure storage
    const agentQuery = `
      INSERT INTO atp_identity.agents (did, public_key, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (did) DO UPDATE SET
        public_key = EXCLUDED.public_key,
        updated_at = EXCLUDED.updated_at
    `;
    
    await this.db.query(agentQuery, [
      keyPair.did,
      keyPair.publicKey,
      this.toISOString(keyPair.created),
      this.toISOString(keyPair.rotated || keyPair.created)
    ]);

    // Store private key in metadata (encrypted in production)
    const metadataQuery = `
      UPDATE atp_identity.agents 
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE did = $1
    `;
    
    // Encrypt private key before storage
    const encryptedPrivateKey = encryptionService.encrypt(keyPair.privateKey);
    
    const privateKeyMetadata = {
      privateKey: encryptedPrivateKey,
      keyRotated: keyPair.rotated || null,
      encrypted: true,
      encryptionVersion: 'v1'
    };
    
    await this.db.query(metadataQuery, [
      keyPair.did,
      this.safeJsonStringify(privateKeyMetadata)
    ]);
  }

  async getKeyPair(did: string): Promise<KeyPair | null> {
    const query = `
      SELECT did, public_key, metadata, created_at, updated_at
      FROM atp_identity.agents WHERE did = $1
    `;
    const result = await this.db.query(query, [did]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    const metadata = this.safeJsonParse<any>(row.metadata) || {};
    
    // Decrypt private key if it was encrypted
    let privateKey = '';
    if (metadata.encrypted && metadata.privateKey) {
      try {
        privateKey = encryptionService.decrypt(metadata.privateKey);
      } catch (error) {
        console.error('Failed to decrypt private key:', error);
        throw new Error('Unable to decrypt private key');
      }
    } else {
      // Legacy unencrypted keys detected - migrate automatically
      if (metadata.privateKey) {
        console.warn(`Migrating legacy unencrypted private key for DID: ${row.did}`);
        await this.migrateLegacyPrivateKey(row.did, metadata.privateKey);
        privateKey = metadata.privateKey;
      } else {
        throw new Error('Private key not found and not encrypted');
      }
    }
    
    return {
      did: row.did,
      publicKey: row.public_key,
      privateKey,
      created: row.created_at,
      rotated: metadata.keyRotated,
    };
  }

  async rotateKey(did: string): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await CryptoUtils.generateKeyPair();
    const now = new Date().toISOString();
    
    // Update public key in agents table
    const updateAgentQuery = `
      UPDATE atp_identity.agents 
      SET public_key = $1, updated_at = $2
      WHERE did = $3
    `;
    
    await this.db.query(updateAgentQuery, [keyPair.publicKey, now, did]);
    
    // Update private key in metadata
    const updateMetadataQuery = `
      UPDATE atp_identity.agents 
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE did = $1
    `;
    
    const privateKeyMetadata = {
      privateKey: keyPair.privateKey,
      keyRotated: now
    };
    
    await this.db.query(updateMetadataQuery, [
      did,
      this.safeJsonStringify(privateKeyMetadata)
    ]);
    
    return keyPair;
  }

  async listDIDs(): Promise<string[]> {
    const query = 'SELECT did FROM atp_identity.did_documents ORDER BY created_at DESC';
    const result = await this.db.query(query);
    return result.rows.map((row: any) => row.did);
  }

  /**
   * Migrates legacy unencrypted private key to encrypted storage
   * @private
   */
  private async migrateLegacyPrivateKey(did: string, plaintextPrivateKey: string): Promise<void> {
    try {
      // Encrypt the plaintext private key
      const encryptedPrivateKey = encryptionService.encrypt(plaintextPrivateKey);
      
      // Update metadata with encrypted key
      const encryptedMetadata = {
        privateKey: encryptedPrivateKey,
        encrypted: true,
        encryptionVersion: 'v1',
        migratedAt: new Date().toISOString()
      };

      const updateQuery = `
        UPDATE atp_identity.agents 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
        WHERE did = $1
      `;

      await this.db.query(updateQuery, [
        did,
        this.safeJsonStringify(encryptedMetadata)
      ]);

      console.log(`Successfully migrated private key encryption for DID: ${did}`);
    } catch (error) {
      console.error(`Failed to migrate private key for DID ${did}:`, error);
      throw new Error(`Private key migration failed for ${did}`);
    }
  }
}
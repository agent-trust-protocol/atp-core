import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { VerifiableCredential, CredentialSchema } from '../models/credential.js';

export class StorageService extends BaseStorage {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Tables are created by init-db.sql, just verify connection
  }

  async storeCredential(credential: VerifiableCredential): Promise<void> {
    const query = `
      INSERT INTO atp_credentials.credentials 
      (credential_id, issuer_did, subject_did, credential_type, credential_data, proof, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (credential_id) DO UPDATE SET
        credential_data = EXCLUDED.credential_data,
        proof = EXCLUDED.proof,
        expires_at = EXCLUDED.expires_at
    `;
    
    const issuer = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    const type = credential.type.find(t => t !== 'VerifiableCredential') || 'VerifiableCredential';
    
    await this.db.query(query, [
      credential.id,
      issuer,
      credential.credentialSubject.id || '',
      type,
      this.safeJsonStringify(credential),
      this.safeJsonStringify(credential.proof || {}),
      this.toISOString(credential.issuanceDate),
      credential.expirationDate ? this.toISOString(credential.expirationDate) : null
    ]);
  }

  async getCredential(credentialId: string): Promise<VerifiableCredential | null> {
    const query = 'SELECT credential_data FROM atp_credentials.credentials WHERE credential_id = $1';
    const result = await this.db.query(query, [credentialId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // PostgreSQL JSONB returns objects, not strings
    return result.rows[0].credential_data as VerifiableCredential;
  }

  async revokeCredential(credentialId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Update credential status
      const updateQuery = 'UPDATE atp_credentials.credentials SET status = $1 WHERE credential_id = $2';
      await client.query(updateQuery, ['revoked', credentialId]);
      
      // Note: Revocation list is handled by the status field in the main table
      // No separate revocation_list table in the PostgreSQL schema
    });
  }

  async isCredentialRevoked(credentialId: string): Promise<boolean> {
    const query = 'SELECT status FROM atp_credentials.credentials WHERE credential_id = $1';
    const result = await this.db.query(query, [credentialId]);
    
    return result.rows.length > 0 && result.rows[0].status === 'revoked';
  }

  async storeSchema(schema: CredentialSchema): Promise<void> {
    const query = `
      INSERT INTO atp_credentials.schemas (schema_id, schema_name, schema_version, schema_definition, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (schema_id) DO UPDATE SET
        schema_name = EXCLUDED.schema_name,
        schema_version = EXCLUDED.schema_version,
        schema_definition = EXCLUDED.schema_definition
    `;
    
    await this.db.query(query, [
      schema.id,
      schema.name,
      schema.version || '1.0',
      this.safeJsonStringify(schema),
      this.toISOString()
    ]);
  }

  async getSchema(schemaId: string): Promise<CredentialSchema | null> {
    const query = 'SELECT schema_definition FROM atp_credentials.schemas WHERE schema_id = $1';
    const result = await this.db.query(query, [schemaId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // PostgreSQL JSONB returns objects, not strings
    return result.rows[0].schema_definition as CredentialSchema;
  }

  async getSchemaByName(name: string): Promise<CredentialSchema | null> {
    const query = 'SELECT schema_definition FROM atp_credentials.schemas WHERE schema_name = $1';
    const result = await this.db.query(query, [name]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // PostgreSQL JSONB returns objects, not strings
    return result.rows[0].schema_definition as CredentialSchema;
  }

  async listSchemas(): Promise<CredentialSchema[]> {
    const query = 'SELECT schema_definition FROM atp_credentials.schemas ORDER BY created_at DESC';
    const result = await this.db.query(query);
    
    // PostgreSQL JSONB returns objects, not strings
    return result.rows.map((row: any) => row.schema_definition as CredentialSchema);
  }
}
import { BaseClient } from './base.js';
import { 
  ATPConfig, 
  VerifiableCredential, 
  VerifiablePresentation,
  ATPResponse 
} from '../types.js';

export interface CredentialIssuanceRequest {
  subjectDID: string;
  credentialType: string;
  claims: any;
  expirationDate?: string;
}

export interface CredentialRevocationRequest {
  credentialId: string;
  reason: string;
}

export interface PresentationRequest {
  credentialIds: string[];
  audience: string;
  challenge?: string;
}

export interface CredentialVerificationRequest {
  credential: VerifiableCredential;
  checkRevocation?: boolean;
}

export interface CredentialQuery {
  subjectDID?: string;
  issuerDID?: string;
  credentialType?: string;
  status?: 'active' | 'revoked' | 'expired';
  limit?: number;
  offset?: number;
}

export interface SchemaDefinition {
  name: string;
  version: string;
  description?: string;
  properties: Record<string, any>;
  required?: string[];
}

export class CredentialsClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'credentials');
  }

  /**
   * Issue a new verifiable credential
   */
  async issueCredential(request: CredentialIssuanceRequest): Promise<ATPResponse<VerifiableCredential>> {
    return this.post('/credentials/issue', request);
  }

  /**
   * Verify a verifiable credential
   */
  async verifyCredential(request: CredentialVerificationRequest): Promise<ATPResponse<{ 
    valid: boolean; 
    error?: string;
    checks: {
      signature: boolean;
      expiration: boolean;
      revocation: boolean;
      schema: boolean;
    };
  }>> {
    return this.post('/credentials/verify', request);
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(request: CredentialRevocationRequest): Promise<ATPResponse<{ success: boolean }>> {
    return this.post('/credentials/revoke', request);
  }

  /**
   * Get credential by ID
   */
  async getCredential(credentialId: string): Promise<ATPResponse<VerifiableCredential>> {
    return this.get(`/credentials/${encodeURIComponent(credentialId)}`);
  }

  /**
   * Query credentials with filters
   */
  async queryCredentials(query: CredentialQuery): Promise<ATPResponse<{
    credentials: VerifiableCredential[];
    total: number;
  }>> {
    return this.get('/credentials', { params: query });
  }

  /**
   * Get credentials for a specific DID
   */
  async getCredentialsForDID(did: string, params?: {
    credentialType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    credentials: VerifiableCredential[];
    total: number;
  }>> {
    return this.get(`/credentials/holder/${encodeURIComponent(did)}`, { params });
  }

  /**
   * Create a verifiable presentation
   */
  async createPresentation(request: PresentationRequest): Promise<ATPResponse<VerifiablePresentation>> {
    return this.post('/presentations/create', request);
  }

  /**
   * Verify a verifiable presentation
   */
  async verifyPresentation(presentation: VerifiablePresentation): Promise<ATPResponse<{
    valid: boolean;
    error?: string;
    credentialResults: Array<{
      credentialId: string;
      valid: boolean;
      error?: string;
    }>;
  }>> {
    return this.post('/presentations/verify', { presentation });
  }

  // Schema Management

  /**
   * Register a new credential schema
   */
  async registerSchema(schema: SchemaDefinition): Promise<ATPResponse<{ schemaId: string }>> {
    return this.post('/schemas', schema);
  }

  /**
   * Get schema by ID
   */
  async getSchema(schemaId: string): Promise<ATPResponse<SchemaDefinition>> {
    return this.get(`/schemas/${encodeURIComponent(schemaId)}`);
  }

  /**
   * List all schemas
   */
  async listSchemas(params?: {
    name?: string;
    version?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    schemas: Array<SchemaDefinition & { id: string; createdAt: string }>;
    total: number;
  }>> {
    return this.get('/schemas', { params });
  }

  /**
   * Update schema (create new version)
   */
  async updateSchema(schemaId: string, schema: SchemaDefinition): Promise<ATPResponse<{ schemaId: string }>> {
    return this.put(`/schemas/${encodeURIComponent(schemaId)}`, schema);
  }

  // Revocation Management

  /**
   * Check revocation status of a credential
   */
  async checkRevocationStatus(credentialId: string): Promise<ATPResponse<{
    revoked: boolean;
    revokedAt?: string;
    reason?: string;
  }>> {
    return this.get(`/credentials/${encodeURIComponent(credentialId)}/revocation-status`);
  }

  /**
   * Get revocation list for an issuer
   */
  async getRevocationList(issuerDID: string): Promise<ATPResponse<{
    revokedCredentials: Array<{
      credentialId: string;
      revokedAt: string;
      reason: string;
    }>;
  }>> {
    return this.get(`/revocation-list/${encodeURIComponent(issuerDID)}`);
  }

  // Credential Templates

  /**
   * Create credential from template
   */
  async createFromTemplate(templateId: string, data: {
    subjectDID: string;
    claims: any;
    expirationDate?: string;
  }): Promise<ATPResponse<VerifiableCredential>> {
    return this.post(`/templates/${encodeURIComponent(templateId)}/issue`, data);
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<ATPResponse<Array<{
    id: string;
    name: string;
    description: string;
    schema: SchemaDefinition;
    createdAt: string;
  }>>> {
    return this.get('/templates');
  }

  /**
   * Check service health
   */
  async getHealth(): Promise<ATPResponse<{ status: string; service: string; database?: any }>> {
    return this.get('/health');
  }
}
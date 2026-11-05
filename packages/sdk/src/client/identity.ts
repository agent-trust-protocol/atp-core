import { BaseClient } from './base.js';
import {
  ATPConfig,
  DIDDocument,
  Agent,
  TrustLevel,
  MFASetup,
  MFAStatus,
  ATPResponse
} from '../types.js';

export interface DIDRegistrationRequest {
  publicKey: string;
  trustLevel?: string;
  metadata?: any;
}

export interface TrustLevelUpdateRequest {
  level: string;
  justification: string;
  evidence?: any[];
}

export interface MFASetupRequest {
  accountName: string;
  method: 'totp' | 'hardware';
}

export interface MFAVerificationRequest {
  token?: string;
  backupCode?: string;
  hardwareResponse?: {
    signature: string;
    challenge: string;
  };
}

/**
 * REST client for the ATP identity *registry* service: registration, trust
 * levels, key rotation, MFA, and registry lookups.
 *
 * This client is NOT the did:atp resolver. Spec-compliant resolution
 * (did.json over HTTPS with mandatory dual-binding verification) lives in
 * `DidAtpResolver` (utils/resolver.ts). The registry endpoints here return
 * the service's own records, which carry none of the cryptographic
 * guarantees of resolution.
 */
export class IdentityClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'identity');
  }

  /**
   * Register a new DID with the ATP network
   */
  async registerDID(request: DIDRegistrationRequest): Promise<ATPResponse<{ did: string; document: DIDDocument }>> {
    return this.post('/identity/register', request);
  }

  /**
   * Fetch a DID's registry record (agent profile) from the identity service.
   * Registry lookup only — no resolution-level verification is performed.
   */
  async getRegistryRecord(did: string): Promise<ATPResponse<Agent>> {
    return this.get(`/identity/${encodeURIComponent(did)}`);
  }

  /**
   * Fetch the registry's stored copy of a DID document. Registry lookup
   * only — for verified resolution use `DidAtpResolver.resolve()`.
   */
  async getDIDDocument(did: string): Promise<ATPResponse<DIDDocument>> {
    return this.get(`/identity/${encodeURIComponent(did)}/document`);
  }

  /**
   * Update trust level for a DID
   */
  async updateTrustLevel(did: string, request: TrustLevelUpdateRequest): Promise<ATPResponse<TrustLevel>> {
    return this.put(`/identity/${encodeURIComponent(did)}/trust-level`, request);
  }

  /**
   * Get trust level information for a DID
   */
  async getTrustLevel(did: string): Promise<ATPResponse<TrustLevel>> {
    return this.get(`/identity/${encodeURIComponent(did)}/trust-info`);
  }

  /**
   * List all identities (admin function)
   */
  async listIdentities(params?: {
    limit?: number;
    offset?: number;
    trustLevel?: string;
    status?: string;
  }): Promise<ATPResponse<{ agents: Agent[]; total: number }>> {
    return this.get('/identity', { params });
  }

  // MFA Methods

  /**
   * Setup multi-factor authentication
   */
  async setupMFA(did: string, request: MFASetupRequest): Promise<ATPResponse<MFASetup>> {
    return this.post('/mfa/setup', { did, ...request });
  }

  /**
   * Confirm MFA setup with verification token
   */
  async confirmMFA(did: string, verificationToken: string): Promise<ATPResponse<{ backupCodes: string[] }>> {
    return this.post('/mfa/confirm', { did, verificationToken });
  }

  /**
   * Verify MFA during authentication
   */
  async verifyMFA(did: string, verification: MFAVerificationRequest): Promise<ATPResponse<{ valid: boolean; method?: string }>> {
    return this.post('/mfa/verify', { did, ...verification });
  }

  /**
   * Get MFA status for a DID
   */
  async getMFAStatus(did: string): Promise<ATPResponse<MFAStatus>> {
    return this.get(`/mfa/status/${encodeURIComponent(did)}`);
  }

  /**
   * Disable MFA for a DID
   */
  async disableMFA(did: string, verificationToken: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.post('/mfa/disable', { did, verificationToken });
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(did: string, verificationToken: string): Promise<ATPResponse<{ backupCodes: string[] }>> {
    return this.post('/mfa/backup-codes/regenerate', { did, verificationToken });
  }

  /**
   * Check service health
   */
  async getHealth(): Promise<ATPResponse<{ status: string; service: string; database?: any }>> {
    return this.get('/health');
  }
}

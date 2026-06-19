import { randomUUID, createHash, createHmac } from 'crypto';
import { AuditEvent, AuditEventRequest, AuditQuery } from '../models/audit.js';
import { IAuditStorageService } from '../interfaces/storage.js';
import { IPFSService } from './ipfs.js';
import { ATPEncryptionService } from '@atp/shared';

export class AuditService {
  private encryptionKey: Buffer;
  private signingKey: string;

  constructor(
    private storage: IAuditStorageService,
    private ipfs: IPFSService
  ) {
    // Derive a 32-byte AES key from the env var using SHA-256
    const rawKey = process.env.AUDIT_ENCRYPTION_KEY || '';
    if (!rawKey && process.env.NODE_ENV === 'production') {
      throw new Error('AUDIT_ENCRYPTION_KEY must be set in production');
    }
    this.encryptionKey = createHash('sha256').update(rawKey || randomUUID()).digest();

    // Signing key for HMAC-SHA256 audit event signatures
    this.signingKey = process.env.AUDIT_SIGNING_KEY || process.env.AUDIT_ENCRYPTION_KEY || '';
    if (!this.signingKey && process.env.NODE_ENV === 'production') {
      throw new Error('AUDIT_SIGNING_KEY (or AUDIT_ENCRYPTION_KEY) must be set in production');
    }
  }

  async logEvent(request: AuditEventRequest): Promise<AuditEvent> {
    const timestamp = new Date().toISOString();
    const id = randomUUID();

    // Get the last event to create an immutable chain
    const lastEvent = await this.storage.getLastEvent();
    const previousHash = lastEvent?.hash || '0'.repeat(64); // Genesis hash

    // Encrypt sensitive details BEFORE hashing so the integrity hash and the
    // HMAC signature cover exactly what is persisted. Hashing the plaintext
    // here while storing ciphertext made verifyChainIntegrity() — which
    // recomputes the hash from the stored (encrypted) details — fail for every
    // event that contained sensitive data.
    let details = request.details;
    let encrypted = false;
    if (request.details && this.containsSensitiveData(request.details)) {
      details = await this.encryptSensitiveData(request.details);
      encrypted = true;
    }

    // Create the event data with enhanced security
    const eventData = {
      id,
      timestamp,
      source: request.source,
      action: request.action,
      resource: request.resource,
      actor: request.actor,
      details,
      previousHash,
      nonce: randomUUID(), // Add nonce for additional entropy
      blockNumber: (lastEvent?.blockNumber || 0) + 1,
    };

    // Generate cryptographic hash for integrity (SHA-256)
    const hash = this.generateSecureHash(eventData);

    // Create HMAC-SHA256 signature for non-repudiation
    const signature = await this.signEvent(eventData);

    const event: AuditEvent = {
      id,
      timestamp,
      source: request.source,
      action: request.action,
      resource: request.resource,
      actor: request.actor,
      details,
      hash,
      previousHash,
      signature,
      blockNumber: eventData.blockNumber,
      nonce: eventData.nonce,
      encrypted,
    };

    // Store in IPFS for immutability (gracefully skipped when IPFS is unavailable)
    const ipfsHash = await this.storeInIPFS(event);
    if (ipfsHash) {
      event.ipfsHash = ipfsHash;
    }

    // Store in local database
    await this.storage.storeEvent(event);

    // Verify chain integrity periodically
    if (event.blockNumber && event.blockNumber % 100 === 0) {
      const integrity = await this.verifyChainIntegrity();
      if (!integrity.valid) {
        console.error('⚠️  AUDIT CHAIN INTEGRITY VIOLATION DETECTED:', integrity);
        // In production, this should trigger alerts and emergency procedures
      }
    }

    return event;
  }

  async getEvent(id: string): Promise<AuditEvent | null> {
    return await this.storage.getEvent(id);
  }

  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    return await this.storage.queryEvents(query);
  }

  async verifyIntegrity(): Promise<{ valid: boolean; brokenAt?: string }> {
    return await this.storage.verifyChain();
  }

  async getEventFromIPFS(hash: string): Promise<AuditEvent | null> {
    return await this.ipfs.retrieveEvent(hash);
  }

  async isIPFSAvailable(): Promise<boolean> {
    return await this.ipfs.isAvailable();
  }

  /**
   * Produce a deterministic JSON encoding with recursively sorted object keys.
   *
   * NOTE: a previous implementation used `JSON.stringify(data, Object.keys(data).sort())`.
   * The second argument is interpreted by JSON.stringify as an *allowlist* replacer
   * that is applied recursively, so nested objects (notably `details`) were
   * serialized as `{}` — their content was silently excluded from both the hash
   * chain and the HMAC signature, leaving `details` tampering undetectable.
   * This helper sorts keys deterministically WITHOUT dropping nested content.
   */
  private canonicalize(data: any): string {
    return JSON.stringify(data, (_key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((acc: Record<string, any>, k) => {
            acc[k] = value[k];
            return acc;
          }, {});
      }
      return value;
    });
  }

  private generateSecureHash(data: any): string {
    // Create deterministic hash by sorting keys (recursively, content-preserving)
    const dataString = this.canonicalize(data);
    return createHash('sha256').update(dataString).digest('hex');
  }

  private async signEvent(eventData: any): Promise<string> {
    const dataString = this.canonicalize(eventData);
    if (!this.signingKey) {
      // No key configured — fall back to a hash-only signature in non-production
      return createHash('sha256').update(dataString).digest('hex');
    }
    return createHmac('sha256', this.signingKey).update(dataString).digest('hex');
  }

  private containsSensitiveData(details: Record<string, any>): boolean {
    const sensitiveKeys = [
      'password', 'privateKey', 'secret', 'token', 'key',
      'credential', 'authorization', 'session', 'cookie'
    ];
    const dataString = JSON.stringify(details).toLowerCase();
    return sensitiveKeys.some(key => dataString.includes(key));
  }

  private async encryptSensitiveData(details: Record<string, any>): Promise<Record<string, any>> {
    try {
      const encrypted = ATPEncryptionService.encryptWithKey(
        JSON.stringify(details),
        this.encryptionKey
      );
      return {
        __encrypted: true,
        __algorithm: 'aes-256-gcm',
        __data: encrypted,
      };
    } catch (error) {
      console.warn('Failed to encrypt sensitive audit data:', error);
      return {
        __error: 'Encryption failed - data redacted',
        __redacted: true
      };
    }
  }

  private async storeInIPFS(event: AuditEvent): Promise<string> {
    try {
      return await this.ipfs.storeEvent(event);
    } catch (error) {
      console.warn('Failed to store in IPFS:', error);
      return '';
    }
  }

  private async verifyChainIntegrity(): Promise<{ valid: boolean; brokenAt?: string; totalEvents: number }> {
    try {
      const events = await this.storage.queryEvents({ limit: 10000 });
      const sortedEvents = events.events.sort((a, b) =>
        (a.blockNumber || 0) - (b.blockNumber || 0)
      );

      let previousHash = '0'.repeat(64); // Genesis hash

      for (const event of sortedEvents) {
        if (event.previousHash !== previousHash) {
          return {
            valid: false,
            brokenAt: event.id,
            totalEvents: sortedEvents.length
          };
        }

        // Verify event hash
        const expectedHash = this.generateSecureHash({
          id: event.id,
          timestamp: event.timestamp,
          source: event.source,
          action: event.action,
          resource: event.resource,
          actor: event.actor,
          details: event.details,
          previousHash: event.previousHash,
          nonce: event.nonce,
          blockNumber: event.blockNumber,
        });

        if (event.hash !== expectedHash) {
          return {
            valid: false,
            brokenAt: event.id,
            totalEvents: sortedEvents.length
          };
        }

        previousHash = event.hash;
      }

      return {
        valid: true,
        totalEvents: sortedEvents.length
      };
    } catch (error) {
      console.error('Chain integrity verification failed:', error);
      return {
        valid: false,
        totalEvents: 0
      };
    }
  }

  async getStats(): Promise<{
    totalEvents: number;
    eventsBySource: Record<string, number>;
    eventsByAction: Record<string, number>;
    chainIntegrity: { valid: boolean; brokenAt?: string };
    ipfsAvailable: boolean;
  }> {
    const allEvents = await this.storage.queryEvents({ limit: 10000 });

    const eventsBySource: Record<string, number> = {};
    const eventsByAction: Record<string, number> = {};

    for (const event of allEvents.events) {
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
    }

    const chainIntegrity = await this.verifyIntegrity();
    const ipfsAvailable = await this.isIPFSAvailable();

    return {
      totalEvents: allEvents.total,
      eventsBySource,
      eventsByAction,
      chainIntegrity,
      ipfsAvailable,
    };
  }
}

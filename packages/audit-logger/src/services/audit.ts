import { randomUUID, createHash, createHmac } from 'crypto';
import { AuditEvent, AuditEventRequest, AuditQuery } from '../models/audit.js';
import { IAuditStorageService } from '../interfaces/storage.js';
import { IPFSService } from './ipfs.js';
import { ATPEncryptionService } from '@atp/shared';

/**
 * Prefix marking an audit event signature as UNSIGNED — produced only when no
 * signing key is configured (non-production). It makes the value impossible to
 * mistake for an authenticated HMAC: a bare SHA-256 would be indistinguishable
 * from a real signature yet provides no non-repudiation (anyone can recompute
 * it). Consumers can detect an unsigned event via `AuditService.isSigned()`.
 */
export const UNSIGNED_SIGNATURE_PREFIX = 'unsigned-sha256:';

export class AuditService {
  private encryptionKey: Buffer;
  private signingKey: string;
  private static unsignedWarningEmitted = false;

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
    if (!this.signingKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('AUDIT_SIGNING_KEY (or AUDIT_ENCRYPTION_KEY) must be set in production');
      }
      // Non-production with no key: events are UNSIGNED (integrity only, no
      // non-repudiation). Warn once so the misconfiguration is never silent.
      if (!AuditService.unsignedWarningEmitted) {
        AuditService.unsignedWarningEmitted = true;
        console.warn(
          '[audit] No AUDIT_SIGNING_KEY/AUDIT_ENCRYPTION_KEY configured — audit ' +
          `events will be UNSIGNED (signature marked "${UNSIGNED_SIGNATURE_PREFIX}"). ` +
          'They retain integrity but NOT non-repudiation. Set a signing key outside local development.'
        );
      }
    }
  }

  /**
   * Whether an audit event signature is an authenticated HMAC (true) rather than
   * the keyless UNSIGNED fallback (false). Use to reject unsigned events where
   * non-repudiation is required.
   *
   * CAVEAT — legacy data: events written before this change stored a bare
   * SHA-256 with no prefix when no signing key was configured. Those legacy
   * unsigned events lack the marker and will be reported as signed (true). For
   * pre-migration events, rely on your migration/seal policy rather than this
   * check.
   */
  static isSigned(signature: string | undefined | null): boolean {
    return !!signature && !signature.startsWith(UNSIGNED_SIGNATURE_PREFIX);
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

    // Generate cryptographic hash for integrity (SHA-256). Both the hash and the
    // signature cover only the stable, storage-independent fields (see
    // integrityFields) so they can be recomputed from any backend on read-back.
    const hash = this.generateSecureHash(this.integrityFields(eventData));

    // Create HMAC-SHA256 signature for non-repudiation
    const signature = await this.signEvent(this.integrityFields(eventData));

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
    // Perform full content + linkage verification at the service level rather
    // than delegating to storage.verifyChain(), whose backend implementations
    // only check previousHash linkage and would silently miss content tampering
    // of an entry that still links correctly. verifyChainIntegrity recomputes
    // each event's hash from the stored fields (see integrityFields).
    const { valid, brokenAt } = await this.verifyChainIntegrity();
    return { valid, brokenAt };
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

  /**
   * The stable, storage-independent field set that the integrity hash and the
   * HMAC signature are computed over.
   *
   * Deliberately EXCLUDES `nonce` and `blockNumber`. Those are storage-managed
   * metadata that some backends do not faithfully round-trip — Postgres assigns
   * `block_number` via a stored procedure and persists `nonce` as NULL (see
   * postgres-storage.ts) — so hashing them made the hash recomputed on
   * read-back diverge from the stored hash, which would make verifyIntegrity()
   * report tampering for every event on those backends. Event ordering remains
   * bound cryptographically by `previousHash`, so dropping the positional
   * fields does not weaken content-tamper or reordering detection.
   */
  private integrityFields(e: {
    id: string;
    timestamp: string;
    source: string;
    action: string;
    resource: string;
    actor: string;
    details: any;
    previousHash: string;
  }): Record<string, any> {
    return {
      id: e.id,
      timestamp: e.timestamp,
      source: e.source,
      action: e.action,
      resource: e.resource,
      actor: e.actor,
      details: e.details,
      previousHash: e.previousHash,
    };
  }

  private generateSecureHash(data: any): string {
    // Create deterministic hash by sorting keys (recursively, content-preserving)
    const dataString = this.canonicalize(data);
    return createHash('sha256').update(dataString).digest('hex');
  }

  private async signEvent(eventData: any): Promise<string> {
    const dataString = this.canonicalize(eventData);
    if (!this.signingKey) {
      // No key configured (non-production only — the constructor throws in
      // production). Return an explicitly UNSIGNED, self-identifying marker so
      // this can never be mistaken for an authenticated HMAC signature.
      return `${UNSIGNED_SIGNATURE_PREFIX}${createHash('sha256').update(dataString).digest('hex')}`;
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

        // Verify event hash — recompute over the same stable field set used at
        // store time so it matches regardless of storage backend.
        const expectedHash = this.generateSecureHash(this.integrityFields(event));

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

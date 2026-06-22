/**
 * VcServiceCredentialVerifier
 *
 * Concrete implementation of the `CredentialVerifier` interface that
 * `@atp/shared`'s TrustScoringEngine consumes by dependency injection.
 *
 * WHY THIS LIVES IN vc-service (not in @atp/shared):
 * --------------------------------------------------
 * `@atp/shared` defines the *interface* (`CredentialVerifier` / `CredentialRow`)
 * but must NOT depend on `@atp/vc-service` — that edge would invert the
 * dependency graph (shared is the leaf everything depends on). The concrete
 * verifier that delegates to `CredentialService.verifyCredential` therefore
 * lives here, in vc-service, which already depends on `@atp/shared`. A
 * composition root (e.g. a protocol-integration security wrapper) constructs
 * this adapter and injects it into the engine, so the only dependency edge is
 * the legal vc-service -> shared one.
 *
 * FAIL-CLOSED SEMANTICS:
 * ----------------------
 * The trust engine credits a credential toward trust ONLY when `isVerified`
 * returns true. This adapter returns true ONLY when the full credential payload
 * is present AND `CredentialService.verifyCredential` reports `valid` (issuer
 * signature checks out, not expired, not revoked, schema matches). In every
 * other case — missing/forged payload, verification error, exception — it
 * returns false so a credential can never inflate a trust score on the strength
 * of an unverifiable `status` column alone.
 */

import type { CredentialVerifier, CredentialRow } from '@atp/shared';
import type { VerifiableCredential } from '../models/credential.js';
import type { CredentialService } from './credential.js';

/**
 * The columns this adapter needs in order to verify a credential. The trust
 * engine's current SELECT only returns `type` + `issuer`, which is NOT enough
 * to verify anything — so for real verification the engine's credential SELECT
 * must be widened to also return the full stored VC payload (the
 * `credential_data` JSONB column) and/or the `credential_id` so we can fetch it.
 *
 * We accept either:
 *   - `credential` / `credential_data`: the full VerifiableCredential object, or
 *   - `credential_id`: an id we can resolve through storage (when a fetcher is
 *     wired). Resolution is delegated to `CredentialService` so we do not reach
 *     into storage directly.
 */
interface VerifiableCredentialRow extends CredentialRow {
  credential?: unknown;
  credential_data?: unknown;
  credential_id?: unknown;
  credentialId?: unknown;
}

export class VcServiceCredentialVerifier implements CredentialVerifier {
  constructor(
    private readonly credentialService: CredentialService,
    /**
     * Optional resolver from a credential id to the full VC. Supplied by the
     * composition root when the trust engine's SELECT yields only an id rather
     * than the full payload. When absent, rows that carry only an id fail closed.
     */
    private readonly resolveCredentialById?: (
      credentialId: string
    ) => Promise<VerifiableCredential | null>
  ) {}

  async isVerified(credentialRow: CredentialRow): Promise<boolean> {
    try {
      const credential = await this.extractCredential(
        credentialRow as VerifiableCredentialRow
      );

      // Fail closed: no verifiable payload means we cannot confirm the
      // credential is genuine, so it must not count toward trust.
      if (!credential) {
        return false;
      }

      const result = await this.credentialService.verifyCredential({ credential });
      return result.valid === true;
    } catch {
      // Any verification error -> not verified -> not counted (fail closed).
      return false;
    }
  }

  /**
   * Pull a full VerifiableCredential out of the row, or resolve one by id.
   * Returns null when no verifiable payload is available.
   */
  private async extractCredential(
    row: VerifiableCredentialRow
  ): Promise<VerifiableCredential | null> {
    const inline = row.credential ?? row.credential_data;
    if (this.looksLikeCredential(inline)) {
      return inline as VerifiableCredential;
    }

    const id = row.credential_id ?? row.credentialId;
    if (typeof id === 'string' && id.length > 0 && this.resolveCredentialById) {
      const resolved = await this.resolveCredentialById(id);
      if (this.looksLikeCredential(resolved)) {
        return resolved as VerifiableCredential;
      }
    }

    return null;
  }

  /**
   * Minimal structural guard. We don't trust the row blindly: a value only
   * looks like a credential if it carries the fields verifyCredential needs to
   * do real work (a proof and a credentialSubject). The cryptographic decision
   * is still made by CredentialService — this only avoids handing it garbage.
   */
  private looksLikeCredential(value: unknown): value is VerifiableCredential {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const v = value as Record<string, unknown>;
    return (
      'proof' in v &&
      'credentialSubject' in v &&
      'issuer' in v &&
      Array.isArray(v.type)
    );
  }
}

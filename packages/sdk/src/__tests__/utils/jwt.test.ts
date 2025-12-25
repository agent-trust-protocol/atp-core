/**
 * Tests for JWTUtils
 */

import { JWTUtils } from '../../utils/jwt';

// Note: These tests use mocked implementations since actual JWT signing
// requires valid Ed25519 keys that work with the jose library

describe('JWTUtils', () => {
  // Sample JWT token for testing decode functions
  const samplePayload = {
    iss: 'did:atp:mainnet:test',
    sub: 'did:atp:mainnet:test',
    aud: 'atp:services',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    trustLevel: 'VERIFIED',
    permissions: ['read', 'write']
  };

  // Create a sample JWT for testing (base64url encoded)
  const createMockJWT = (payload: any, expired = false) => {
    const header = { alg: 'EdDSA', typ: 'JWT' };
    const payloadData = expired
      ? { ...payload, exp: Math.floor(Date.now() / 1000) - 3600 }
      : payload;

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
    const signature = 'mocksignature123';

    return `${headerB64}.${payloadB64}.${signature}`;
  };

  describe('decodeJWT', () => {
    it('should decode a valid JWT', () => {
      const token = createMockJWT(samplePayload);
      const result = JWTUtils.decodeJWT(token);

      expect(result).not.toBeNull();
      expect(result!.header.alg).toBe('EdDSA');
      expect(result!.header.typ).toBe('JWT');
      expect(result!.payload.iss).toBe('did:atp:mainnet:test');
      expect(result!.signature).toBe('mocksignature123');
    });

    it('should return null for invalid JWT format', () => {
      expect(JWTUtils.decodeJWT('invalid')).toBeNull();
      expect(JWTUtils.decodeJWT('only.two.parts.here.extra')).toBeNull();
      expect(JWTUtils.decodeJWT('')).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const result = JWTUtils.decodeJWT('!!!.@@@.###');
      expect(result).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired token', () => {
      const token = createMockJWT(samplePayload);
      expect(JWTUtils.isExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = createMockJWT(samplePayload, true);
      expect(JWTUtils.isExpired(token)).toBe(true);
    });

    it('should return true for token without exp', () => {
      const payloadNoExp = { ...samplePayload };
      delete (payloadNoExp as any).exp;
      const token = createMockJWT(payloadNoExp);

      expect(JWTUtils.isExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(JWTUtils.isExpired('invalid')).toBe(true);
    });
  });

  describe('getTimeToExpiration', () => {
    it('should return positive time for non-expired token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { ...samplePayload, exp: futureExp };
      const token = createMockJWT(payload);

      const ttl = JWTUtils.getTimeToExpiration(token);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const token = createMockJWT(samplePayload, true);
      expect(JWTUtils.getTimeToExpiration(token)).toBe(0);
    });

    it('should return 0 for token without exp', () => {
      const payloadNoExp = { ...samplePayload };
      delete (payloadNoExp as any).exp;
      const token = createMockJWT(payloadNoExp);

      expect(JWTUtils.getTimeToExpiration(token)).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      expect(JWTUtils.getTimeToExpiration('invalid')).toBe(0);
    });
  });

  describe('extractDID', () => {
    it('should extract DID from issuer claim', () => {
      const token = createMockJWT(samplePayload);
      expect(JWTUtils.extractDID(token)).toBe('did:atp:mainnet:test');
    });

    it('should fall back to subject claim', () => {
      const payloadNoIss = { ...samplePayload };
      delete (payloadNoIss as any).iss;
      const token = createMockJWT(payloadNoIss);

      expect(JWTUtils.extractDID(token)).toBe('did:atp:mainnet:test');
    });

    it('should return null for token without DID claims', () => {
      const payload = { exp: samplePayload.exp, iat: samplePayload.iat };
      const token = createMockJWT(payload);

      expect(JWTUtils.extractDID(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(JWTUtils.extractDID('invalid')).toBeNull();
    });
  });

  describe('extractTrustLevel', () => {
    it('should extract trust level from token', () => {
      const token = createMockJWT(samplePayload);
      expect(JWTUtils.extractTrustLevel(token)).toBe('VERIFIED');
    });

    it('should return null if no trust level', () => {
      const payloadNoTrust = { ...samplePayload };
      delete (payloadNoTrust as any).trustLevel;
      const token = createMockJWT(payloadNoTrust);

      expect(JWTUtils.extractTrustLevel(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(JWTUtils.extractTrustLevel('invalid')).toBeNull();
    });
  });

  describe('extractPermissions', () => {
    it('should extract permissions from token', () => {
      const token = createMockJWT(samplePayload);
      expect(JWTUtils.extractPermissions(token)).toEqual(['read', 'write']);
    });

    it('should return empty array if no permissions', () => {
      const payloadNoPerms = { ...samplePayload };
      delete (payloadNoPerms as any).permissions;
      const token = createMockJWT(payloadNoPerms);

      expect(JWTUtils.extractPermissions(token)).toEqual([]);
    });

    it('should return empty array for invalid token', () => {
      expect(JWTUtils.extractPermissions('invalid')).toEqual([]);
    });
  });

  describe('Capability Token Structure', () => {
    it('should decode capability token with capabilities', () => {
      const capabilityPayload = {
        iss: 'did:atp:mainnet:issuer',
        sub: 'did:atp:mainnet:subject',
        capabilities: ['read', 'write', 'execute'],
        restrictions: { maxCalls: 100 },
        tokenType: 'capability',
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      };
      const token = createMockJWT(capabilityPayload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded!.payload.tokenType).toBe('capability');
      expect(decoded!.payload.capabilities).toEqual(['read', 'write', 'execute']);
      expect(decoded!.payload.restrictions).toEqual({ maxCalls: 100 });
    });
  });

  describe('Presentation Token Structure', () => {
    it('should decode presentation token with VP claim', () => {
      const presentationPayload = {
        iss: 'did:atp:mainnet:holder',
        aud: 'did:atp:mainnet:verifier',
        vp: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          verifiableCredential: ['cred-123', 'cred-456'],
          holder: 'did:atp:mainnet:holder'
        },
        challenge: 'random-challenge-123',
        tokenType: 'presentation',
        exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes
      };
      const token = createMockJWT(presentationPayload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded!.payload.tokenType).toBe('presentation');
      expect(decoded!.payload.vp.verifiableCredential).toEqual(['cred-123', 'cred-456']);
      expect(decoded!.payload.challenge).toBe('random-challenge-123');
    });
  });

  describe('Refresh Token Structure', () => {
    it('should decode refresh token with jti', () => {
      const refreshPayload = {
        iss: 'did:atp:mainnet:user',
        sub: 'did:atp:mainnet:user',
        aud: 'atp:auth',
        tokenType: 'refresh',
        jti: 'unique-token-id-123',
        scope: 'refresh',
        exp: Math.floor(Date.now() / 1000) + 2592000 // 30 days
      };
      const token = createMockJWT(refreshPayload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded!.payload.tokenType).toBe('refresh');
      expect(decoded!.payload.jti).toBe('unique-token-id-123');
      expect(decoded!.payload.scope).toBe('refresh');
    });
  });

  describe('Auth Token Structure', () => {
    it('should decode auth token with did, permissions, and trustLevel', () => {
      const authPayload = {
        iss: 'did:atp:mainnet:agent',
        sub: 'did:atp:mainnet:agent',
        aud: 'atp:services',
        did: 'did:atp:mainnet:agent',
        permissions: ['identity:read', 'credentials:write'],
        trustLevel: 'TRUSTED',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createMockJWT(authPayload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded!.payload.did).toBe('did:atp:mainnet:agent');
      expect(decoded!.payload.permissions).toEqual(['identity:read', 'credentials:write']);
      expect(decoded!.payload.trustLevel).toBe('TRUSTED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with empty string claims', () => {
      const payload = {
        iss: '',
        sub: '',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createMockJWT(payload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.payload.iss).toBe('');
    });

    it('should handle token with null claims', () => {
      const payload = {
        iss: 'did:atp:test',
        customClaim: null,
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createMockJWT(payload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.payload.customClaim).toBeNull();
    });

    it('should handle token with nested objects', () => {
      const payload = {
        iss: 'did:atp:test',
        complex: {
          nested: {
            deep: {
              value: 'found'
            }
          }
        },
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createMockJWT(payload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.payload.complex.nested.deep.value).toBe('found');
    });

    it('should handle token with array claims', () => {
      const payload = {
        iss: 'did:atp:test',
        scopes: ['read', 'write', 'admin'],
        resources: [
          { id: 'res-1', access: 'full' },
          { id: 'res-2', access: 'read' }
        ],
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createMockJWT(payload);
      const decoded = JWTUtils.decodeJWT(token);

      expect(decoded!.payload.scopes).toHaveLength(3);
      expect(decoded!.payload.resources).toHaveLength(2);
    });

    it('should handle token expiring in the past', () => {
      // Token that expired 1 second ago
      const payload = {
        iss: 'did:atp:test',
        exp: Math.floor(Date.now() / 1000) - 1 // 1 second ago
      };
      const token = createMockJWT(payload);

      // Token past expiration should be expired
      expect(JWTUtils.isExpired(token)).toBe(true);
    });

    it('should handle very large expiration times', () => {
      const farFuture = Math.floor(Date.now() / 1000) + 315360000; // 10 years
      const payload = {
        iss: 'did:atp:test',
        exp: farFuture
      };
      const token = createMockJWT(payload);

      expect(JWTUtils.isExpired(token)).toBe(false);
      expect(JWTUtils.getTimeToExpiration(token)).toBeGreaterThan(0);
    });
  });

  describe('Token Header Validation', () => {
    it('should correctly decode header with kid claim', () => {
      const header = { alg: 'EdDSA', typ: 'JWT', kid: 'did:atp:test#key-1' };
      const payload = { iss: 'did:atp:test', exp: Math.floor(Date.now() / 1000) + 3600 };

      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const token = `${headerB64}.${payloadB64}.signature`;

      const decoded = JWTUtils.decodeJWT(token);
      expect(decoded!.header.kid).toBe('did:atp:test#key-1');
    });

    it('should decode various algorithm types', () => {
      const algorithms = ['EdDSA', 'ES256', 'RS256'];

      for (const alg of algorithms) {
        const header = { alg, typ: 'JWT' };
        const payload = { iss: 'test', exp: Math.floor(Date.now() / 1000) + 3600 };

        const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
        const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `${headerB64}.${payloadB64}.signature`;

        const decoded = JWTUtils.decodeJWT(token);
        expect(decoded!.header.alg).toBe(alg);
      }
    });
  });
});

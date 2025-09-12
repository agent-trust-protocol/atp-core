import { SignJWT, jwtVerify, JWTPayload } from 'jose';

/**
 * JWT utilities for ATP™ SDK
 */
export class JWTUtils {
  /**
   * Create a DID-JWT token
   */
  static async createDIDJWT(
    payload: JWTPayload,
    privateKey: string,
    did: string,
    options?: {
      expiresIn?: string | number;
      audience?: string;
      issuer?: string;
    }
  ): Promise<string> {
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    const jwt = new SignJWT({
      ...payload,
      iss: options?.issuer || did,
      sub: did,
      aud: options?.audience || 'atp:services'
    })
      .setProtectedHeader({
        alg: 'EdDSA',
        typ: 'JWT',
        kid: `${did}#key-1`
      })
      .setIssuedAt();

    if (options?.expiresIn) {
      if (typeof options.expiresIn === 'string') {
        jwt.setExpirationTime(options.expiresIn);
      } else {
        jwt.setExpirationTime(Math.floor(Date.now() / 1000) + options.expiresIn);
      }
    } else {
      jwt.setExpirationTime('1h'); // Default 1 hour
    }

    return jwt.sign(privateKeyBuffer);
  }

  /**
   * Verify a DID-JWT token
   */
  static async verifyDIDJWT(
    token: string,
    publicKey: string,
    options?: {
      audience?: string;
      issuer?: string;
      clockTolerance?: string | number;
    }
  ): Promise<{
    valid: boolean;
    payload?: JWTPayload;
    error?: string;
  }> {
    try {
      const publicKeyBuffer = Buffer.from(publicKey, 'hex');

      const { payload } = await jwtVerify(token, publicKeyBuffer, {
        audience: options?.audience,
        issuer: options?.issuer,
        clockTolerance: options?.clockTolerance || 30 // 30 seconds
      });

      return {
        valid: true,
        payload
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decode JWT without verification
   */
  static decodeJWT(token: string): {
    header: any;
    payload: any;
    signature: string;
  } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      const signature = parts[2];

      return { header, payload, signature };
    } catch {
      return null;
    }
  }

  /**
   * Check if JWT is expired
   */
  static isExpired(token: string): boolean {
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < now;
  }

  /**
   * Get time until expiration in seconds
   */
  static getTimeToExpiration(token: string): number {
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.payload.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.payload.exp - now);
  }

  /**
   * Create authentication token for ATP services
   */
  static async createAuthToken(
    did: string,
    privateKey: string,
    options?: {
      audience?: string;
      expiresIn?: string | number;
      permissions?: string[];
      trustLevel?: string;
    }
  ): Promise<string> {
    const payload: JWTPayload = {
      did,
      permissions: options?.permissions || [],
      trustLevel: options?.trustLevel || 'BASIC'
    };

    return this.createDIDJWT(payload, privateKey, did, {
      audience: options?.audience || 'atp:services',
      expiresIn: options?.expiresIn || '1h'
    });
  }

  /**
   * Create capability token
   */
  static async createCapabilityToken(
    issuer: string,
    subject: string,
    capabilities: string[],
    privateKey: string,
    options?: {
      expiresIn?: string | number;
      audience?: string;
      restrictions?: any;
    }
  ): Promise<string> {
    const payload: JWTPayload = {
      sub: subject,
      capabilities,
      restrictions: options?.restrictions,
      tokenType: 'capability'
    };

    return this.createDIDJWT(payload, privateKey, issuer, {
      audience: options?.audience || 'atp:services',
      expiresIn: options?.expiresIn || '24h'
    });
  }

  /**
   * Verify capability token
   */
  static async verifyCapabilityToken(
    token: string,
    publicKey: string,
    requiredCapability?: string
  ): Promise<{
    valid: boolean;
    capabilities?: string[];
    subject?: string;
    restrictions?: any;
    error?: string;
  }> {
    const result = await this.verifyDIDJWT(token, publicKey);

    if (!result.valid) {
      return result;
    }

    const payload = result.payload!;

    if (payload.tokenType !== 'capability') {
      return {
        valid: false,
        error: 'Not a capability token'
      };
    }

    const capabilities = payload.capabilities as string[] || [];

    if (requiredCapability && !capabilities.includes(requiredCapability)) {
      return {
        valid: false,
        error: `Missing required capability: ${requiredCapability}`
      };
    }

    return {
      valid: true,
      capabilities,
      subject: payload.sub,
      restrictions: payload.restrictions
    };
  }

  /**
   * Create presentation token for verifiable credentials
   */
  static async createPresentationToken(
    holder: string,
    audience: string,
    credentialIds: string[],
    privateKey: string,
    options?: {
      challenge?: string;
      expiresIn?: string | number;
    }
  ): Promise<string> {
    const payload: JWTPayload = {
      vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: credentialIds,
        holder
      },
      challenge: options?.challenge,
      tokenType: 'presentation'
    };

    return this.createDIDJWT(payload, privateKey, holder, {
      audience,
      expiresIn: options?.expiresIn || '15m'
    });
  }

  /**
   * Extract DID from JWT token
   */
  static extractDID(token: string): string | null {
    const decoded = this.decodeJWT(token);
    return decoded?.payload?.iss || decoded?.payload?.sub || null;
  }

  /**
   * Extract trust level from JWT token
   */
  static extractTrustLevel(token: string): string | null {
    const decoded = this.decodeJWT(token);
    return decoded?.payload?.trustLevel || null;
  }

  /**
   * Extract permissions from JWT token
   */
  static extractPermissions(token: string): string[] {
    const decoded = this.decodeJWT(token);
    return decoded?.payload?.permissions || [];
  }

  /**
   * Create refresh token
   */
  static async createRefreshToken(
    did: string,
    privateKey: string,
    tokenId: string,
    options?: {
      expiresIn?: string | number;
    }
  ): Promise<string> {
    const payload: JWTPayload = {
      tokenType: 'refresh',
      jti: tokenId,
      scope: 'refresh'
    };

    return this.createDIDJWT(payload, privateKey, did, {
      audience: 'atp:auth',
      expiresIn: options?.expiresIn || '30d'
    });
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(
    token: string,
    publicKey: string
  ): Promise<{
    valid: boolean;
    tokenId?: string;
    did?: string;
    error?: string;
  }> {
    const result = await this.verifyDIDJWT(token, publicKey, {
      audience: 'atp:auth'
    });

    if (!result.valid) {
      return result;
    }

    const payload = result.payload!;

    if (payload.tokenType !== 'refresh') {
      return {
        valid: false,
        error: 'Not a refresh token'
      };
    }

    return {
      valid: true,
      tokenId: payload.jti as string,
      did: payload.iss as string
    };
  }
}

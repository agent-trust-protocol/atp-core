import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { initializeCrypto } from '@atp/shared';
import * as ed25519 from '@noble/ed25519';

initializeCrypto();

export interface DIDJWTPayload extends JWTPayload {
  did: string;
  nonce: string;
  capabilities?: string[];
  trustLevel?: string;
}

export class DIDJWTService {
  constructor() {}

  async createDIDJWT(
    payload: DIDJWTPayload,
    privateKeyHex: string,
    did: string,
    expiresIn: string = '1h'
  ): Promise<string> {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    
    // Create a JWT with Ed25519 algorithm
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg: 'EdDSA',
        typ: 'JWT',
        kid: `${did}#key-1`,
      })
      .setIssuedAt()
      .setIssuer(did)
      .setSubject(did)
      .setAudience('atp-gateway')
      .setExpirationTime(expiresIn)
      .sign(privateKeyBytes);

    return jwt;
  }

  async verifyDIDJWT(jwt: string): Promise<DIDJWTPayload | null> {
    try {
      // Decode the JWT header to get the kid
      const [headerBase64] = jwt.split('.');
      const header = JSON.parse(Buffer.from(headerBase64, 'base64url').toString());
      
      if (!header.kid) {
        console.warn('JWT missing kid in header');
        return null;
      }

      // Extract DID from kid
      const did = header.kid.split('#')[0];
      
      // Resolve DID to get public key
      const didDocument = await this.resolveDID(did);
      if (!didDocument) {
        console.warn('Could not resolve DID from JWT');
        return null;
      }

      const publicKey = this.extractPublicKey(didDocument);
      if (!publicKey) {
        console.warn('Could not extract public key from DID document');
        return null;
      }

      const publicKeyBytes = Buffer.from(publicKey, 'hex');

      // Verify the JWT
      const { payload } = await jwtVerify(jwt, publicKeyBytes, {
        issuer: did,
        audience: 'atp-gateway',
      });

      return payload as DIDJWTPayload;
    } catch (error) {
      console.error('DID-JWT verification failed:', error);
      return null;
    }
  }

  async createAuthChallenge(did: string): Promise<string> {
    const nonce = this.generateNonce();
    const challenge = {
      did,
      nonce,
      timestamp: Date.now(),
      challenge: 'atp-auth-challenge',
    };

    return Buffer.from(JSON.stringify(challenge)).toString('base64url');
  }

  async verifyAuthResponse(
    challenge: string,
    response: string,
    signature: string,
    did: string
  ): Promise<boolean> {
    try {
      // Decode challenge
      const challengeData = JSON.parse(Buffer.from(challenge, 'base64url').toString());
      
      // Verify timestamp (within 5 minutes)
      const now = Date.now();
      if (Math.abs(now - challengeData.timestamp) > 5 * 60 * 1000) {
        console.warn('Challenge timestamp expired');
        return false;
      }

      // Verify DID matches
      if (challengeData.did !== did) {
        console.warn('DID mismatch in challenge');
        return false;
      }

      // Resolve DID to get public key
      const didDocument = await this.resolveDID(did);
      if (!didDocument) {
        return false;
      }

      const publicKey = this.extractPublicKey(didDocument);
      if (!publicKey) {
        return false;
      }

      // Verify signature
      const message = `${challenge}:${response}`;
      const messageBytes = Buffer.from(message, 'utf8');
      const signatureBytes = Buffer.from(signature, 'hex');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');

      return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch (error) {
      console.error('Auth response verification failed:', error);
      return false;
    }
  }

  private async resolveDID(did: string): Promise<any> {
    try {
      // Call identity service to resolve DID
      const response = await fetch(`http://localhost:3001/identity/${encodeURIComponent(did)}`);
      if (!response.ok) {
        return null;
      }
      
      const result = await response.json() as any;
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to resolve DID:', error);
      return null;
    }
  }

  private extractPublicKey(didDocument: any): string | null {
    try {
      const verificationMethod = didDocument.verificationMethod?.[0];
      if (!verificationMethod) {
        return null;
      }

      // Extract public key from multibase encoding
      const multibase = verificationMethod.publicKeyMultibase;
      if (!multibase || !multibase.startsWith('z')) {
        return null;
      }

      // Decode base58 and remove ed25519 prefix
      const decoded = this.base58decode(multibase.slice(1));
      if (decoded.length < 2) {
        return null;
      }

      // Remove ed25519 prefix (0xed, 0x01)
      const publicKeyBytes = decoded.slice(2);
      return Buffer.from(publicKeyBytes).toString('hex');
    } catch (error) {
      console.error('Failed to extract public key:', error);
      return null;
    }
  }

  private base58decode(str: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    let multi = BigInt(1);
    
    for (let i = str.length - 1; i >= 0; i--) {
      const char = str[i];
      const charIndex = alphabet.indexOf(char);
      if (charIndex === -1) {
        throw new Error('Invalid base58 character');
      }
      num += BigInt(charIndex) * multi;
      multi *= 58n;
    }
    
    // Convert to bytes
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }
    
    // Add leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
      bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
  }

  private generateNonce(): string {
    const bytes = new Uint8Array(16);
    try {
      // Try Node.js crypto first since this is a server-side service
      const crypto = require('crypto');
      const buffer = crypto.randomBytes(16);
      bytes.set(buffer);
    } catch {
      // Fallback to generating pseudo-random bytes
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Buffer.from(bytes).toString('hex');
  }
}
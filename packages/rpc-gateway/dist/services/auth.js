import { DIDJWTService } from './did-jwt.js';
import { nonceService } from '@atp/shared/dist/security/nonce-service.js';
export class AuthService {
    didJWTService;
    mtlsService;
    constructor(mtlsService) {
        this.didJWTService = new DIDJWTService();
        this.mtlsService = mtlsService;
    }
    async authenticateRequest(req, authHeader) {
        const context = {
            authenticated: false,
            authMethod: 'none',
        };
        // Try mTLS authentication first
        if (this.mtlsService) {
            const certificate = this.mtlsService.extractClientCertificate(req);
            if (certificate) {
                const isValid = await this.mtlsService.validateClientCertificate(certificate);
                if (isValid) {
                    context.authenticated = true;
                    context.authMethod = 'mtls';
                    context.certificate = certificate;
                    context.did = certificate.did;
                    await this.enrichContextWithDIDInfo(context);
                    return context;
                }
            }
        }
        // Try DID-JWT authentication
        if (authHeader?.startsWith('Bearer ')) {
            const jwt = authHeader.substring(7);
            const payload = await this.didJWTService.verifyDIDJWT(jwt);
            if (payload) {
                context.authenticated = true;
                context.authMethod = 'did-jwt';
                context.jwt = payload;
                context.did = payload.did;
                context.capabilities = payload.capabilities;
                context.trustLevel = payload.trustLevel;
                return context;
            }
        }
        return context;
    }
    async verifyAuth(authData) {
        try {
            // Validate nonce to prevent replay attacks
            if (!authData.nonce || !await nonceService.validateNonce(authData.did, authData.nonce, authData.timestamp)) {
                console.warn('Invalid or replayed nonce');
                return false;
            }
            // Verify timestamp (reduced to 1 minute for better security)
            const now = Date.now();
            const timestampDiff = Math.abs(now - authData.timestamp);
            if (timestampDiff > 60 * 1000) { // Reduced from 5 minutes to 1 minute
                console.warn('Authentication timestamp too old');
                return false;
            }
            // Create challenge message
            const challenge = `${authData.did}:${authData.timestamp}`;
            // Verify signature against DID document
            const didDocument = await this.resolveDID(authData.did);
            if (!didDocument) {
                console.warn('Could not resolve DID document');
                return false;
            }
            const publicKey = this.extractPublicKey(didDocument);
            if (!publicKey) {
                console.warn('Could not extract public key from DID document');
                return false;
            }
            const isValid = await this.verifySignature(challenge, authData.proof, publicKey);
            return isValid;
        }
        catch (error) {
            console.error('Authentication verification failed:', error);
            return false;
        }
    }
    async createAuthChallenge(did) {
        return await this.didJWTService.createAuthChallenge(did);
    }
    async verifyAuthResponse(challenge, response, signature, did) {
        return await this.didJWTService.verifyAuthResponse(challenge, response, signature, did);
    }
    async enrichContextWithDIDInfo(context) {
        if (!context.did) {
            return;
        }
        try {
            const didDocument = await this.resolveDID(context.did);
            if (didDocument?.metadata) {
                context.trustLevel = didDocument.metadata.trustLevel;
            }
        }
        catch (error) {
            console.warn('Could not enrich auth context with DID info:', error);
        }
    }
    async resolveDID(did) {
        try {
            // Call identity service to resolve DID
            const response = await fetch(`http://localhost:3001/identity/${encodeURIComponent(did)}`);
            if (!response.ok) {
                return null;
            }
            const result = await response.json();
            return result.success ? result.data : null;
        }
        catch (error) {
            console.error('Failed to resolve DID:', error);
            return null;
        }
    }
    extractPublicKey(didDocument) {
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
        }
        catch (error) {
            console.error('Failed to extract public key:', error);
            return null;
        }
    }
    async verifySignature(message, signatureHex, publicKeyHex) {
        try {
            // Import crypto setup
            const { initializeCrypto } = await import('@atp/shared');
            initializeCrypto();
            const crypto = await import('@noble/ed25519');
            const messageBytes = Buffer.from(message, 'utf8');
            const signatureBytes = Buffer.from(signatureHex, 'hex');
            const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
            return await crypto.verify(signatureBytes, messageBytes, publicKeyBytes);
        }
        catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }
    base58decode(str) {
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
        const bytes = [];
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
    isAuthorized(context, requiredCapability, minimumTrustLevel) {
        if (!context.authenticated) {
            return false;
        }
        // Check capability requirement
        if (requiredCapability && context.capabilities) {
            if (!context.capabilities.includes(requiredCapability)) {
                return false;
            }
        }
        // Check trust level requirement
        if (minimumTrustLevel && context.trustLevel) {
            const trustLevels = ['untrusted', 'basic', 'verified', 'premium', 'enterprise'];
            const currentLevel = trustLevels.indexOf(context.trustLevel);
            const requiredLevel = trustLevels.indexOf(minimumTrustLevel);
            if (currentLevel < requiredLevel) {
                return false;
            }
        }
        return true;
    }
}

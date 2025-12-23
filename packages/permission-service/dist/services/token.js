import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
export class TokenService {
    secretKey;
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    async createCapabilityToken(capability) {
        const payload = {
            ...capability,
            iat: Math.floor(capability.issuedAt / 1000),
            exp: Math.floor(capability.expiresAt / 1000),
        };
        if (capability.notBefore) {
            payload.nbf = Math.floor(capability.notBefore / 1000);
        }
        return jwt.sign(payload, this.secretKey, {
            algorithm: 'HS256',
            issuer: capability.issuer,
            subject: capability.subject,
            audience: capability.audience,
        });
    }
    async validateCapabilityToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            const capability = {
                id: decoded.id,
                issuer: decoded.iss,
                subject: decoded.sub,
                audience: decoded.aud,
                scopes: decoded.scopes,
                resource: decoded.resource,
                conditions: decoded.conditions,
                issuedAt: decoded.iat * 1000,
                expiresAt: decoded.exp * 1000,
                notBefore: decoded.nbf ? decoded.nbf * 1000 : undefined,
            };
            return {
                valid: true,
                payload: capability,
            };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Invalid token',
            };
        }
    }
    async refreshToken(token, newExpiresAt) {
        const validation = await this.validateCapabilityToken(token);
        if (!validation.valid || !validation.payload) {
            return null;
        }
        const refreshed = {
            ...validation.payload,
            id: randomUUID(),
            issuedAt: Date.now(),
            expiresAt: newExpiresAt,
        };
        return await this.createCapabilityToken(refreshed);
    }
}

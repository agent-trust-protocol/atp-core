import { CapabilityToken, TokenValidationResult } from '../models/permission.js';
export declare class TokenService {
    private secretKey;
    constructor(secretKey: string);
    createCapabilityToken(capability: CapabilityToken): Promise<string>;
    validateCapabilityToken(token: string): Promise<TokenValidationResult>;
    refreshToken(token: string, newExpiresAt: number): Promise<string | null>;
}
//# sourceMappingURL=token.d.ts.map
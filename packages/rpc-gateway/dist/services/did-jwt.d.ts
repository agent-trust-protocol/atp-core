import { JWTPayload } from 'jose';
export interface DIDJWTPayload extends JWTPayload {
    did: string;
    nonce: string;
    capabilities?: string[];
    trustLevel?: string;
}
export declare class DIDJWTService {
    constructor();
    createDIDJWT(payload: DIDJWTPayload, privateKeyHex: string, did: string, expiresIn?: string): Promise<string>;
    verifyDIDJWT(jwt: string): Promise<DIDJWTPayload | null>;
    createAuthChallenge(did: string): Promise<string>;
    verifyAuthResponse(challenge: string, response: string, signature: string, did: string): Promise<boolean>;
    private resolveDID;
    private extractPublicKey;
    private base58decode;
    private generateNonce;
}
//# sourceMappingURL=did-jwt.d.ts.map
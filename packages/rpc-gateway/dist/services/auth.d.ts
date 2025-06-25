import { AuthMessage } from '../models/rpc.js';
import { DIDJWTPayload } from './did-jwt.js';
import { MTLSService, ClientCertificate } from './mtls.js';
import { IncomingMessage } from 'http';
export interface AuthContext {
    did?: string;
    trustLevel?: string;
    capabilities?: string[];
    authenticated: boolean;
    authMethod: 'did-signature' | 'did-jwt' | 'mtls' | 'none';
    certificate?: ClientCertificate;
    jwt?: DIDJWTPayload;
}
export declare class AuthService {
    private didJWTService;
    private mtlsService?;
    constructor(mtlsService?: MTLSService);
    authenticateRequest(req: IncomingMessage, authHeader?: string): Promise<AuthContext>;
    verifyAuth(authData: AuthMessage): Promise<boolean>;
    createAuthChallenge(did: string): Promise<string>;
    verifyAuthResponse(challenge: string, response: string, signature: string, did: string): Promise<boolean>;
    private enrichContextWithDIDInfo;
    private resolveDID;
    private extractPublicKey;
    private verifySignature;
    private base58decode;
    isAuthorized(context: AuthContext, requiredCapability?: string, minimumTrustLevel?: string): boolean;
}

import https from 'https';
import { IncomingMessage } from 'http';
import { DIDCertificateAuthority, DIDCertificate } from './did-ca.js';
export interface MTLSConfig {
    ca: string[];
    cert: string;
    key: string;
    requestCert: boolean;
    rejectUnauthorized: boolean;
}
export interface ClientCertificate {
    subject: any;
    issuer: any;
    valid_from: string;
    valid_to: string;
    fingerprint: string;
    fingerprint256?: string;
    did?: string;
    didCertificate?: DIDCertificate;
    trustLevel?: string;
    verified?: boolean;
    verificationError?: string;
}
export declare class MTLSService {
    private config;
    private didCA;
    constructor(config: MTLSConfig, didCA?: DIDCertificateAuthority);
    createHTTPSServer(app: any): https.Server;
    extractClientCertificate(req: IncomingMessage): ClientCertificate | null;
    validateClientCertificate(certificate: ClientCertificate): Promise<boolean>;
    private performEnhancedCertificateValidation;
    private validateDIDCertificate;
    private certificateMatchesPublicKey;
    private extractDIDFromCertificate;
    private resolveDID;
    private verifyDIDCertificateBinding;
    private checkCertificateRevocation;
    issueDIDCertificate(did: string, publicKey: string, trustLevel: string): Promise<any>;
    revokeDIDCertificate(certificateId: string, reason: string, revokerDID: string): Promise<void>;
    getDIDCAStats(): any;
    getDIDCACertificate(): any;
    getRevocationList(): any;
    private generateProofSignature;
    private logCertificateEvent;
    static loadTLSConfig(configPath: string): MTLSConfig;
}
//# sourceMappingURL=mtls.d.ts.map
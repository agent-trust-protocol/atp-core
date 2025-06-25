import { TrustLevel } from '@atp/shared';
export interface DIDCertificate {
    certificateId: string;
    subjectDID: string;
    issuerDID: string;
    publicKey: string;
    keyUsage: string[];
    trustLevel: TrustLevel;
    validFrom: string;
    validUntil: string;
    signature: string;
    fingerprint: string;
    status: 'active' | 'revoked' | 'expired';
    extensions?: {
        subjectAltName?: string[];
        keyUsage?: string[];
        extendedKeyUsage?: string[];
        basicConstraints?: {
            isCA: boolean;
            pathLength?: number;
        };
    };
}
export interface CertificateRequest {
    subjectDID: string;
    publicKey: string;
    requestedTrustLevel: TrustLevel;
    keyUsage: string[];
    validityPeriod: number;
    proof: {
        challenge: string;
        signature: string;
    };
}
export interface CertificateRevocationList {
    issuerDID: string;
    revokedCertificates: Array<{
        certificateId: string;
        revocationDate: string;
        reason: string;
    }>;
    nextUpdate: string;
    signature: string;
}
/**
 * ATP™ DID-based Certificate Authority
 * Issues and manages certificates for mutual authentication
 */
export declare class DIDCertificateAuthority {
    private caDID;
    private caCertificate;
    private caPrivateKey;
    private certificates;
    private revocationList;
    constructor(caDID: string, caPrivateKey?: string);
    private generateCAKeyPair;
    private initializeCA;
    issueCertificate(request: CertificateRequest): Promise<DIDCertificate>;
    revokeCertificate(certificateId: string, reason: string, revokerDID: string): Promise<void>;
    verifyCertificate(certificate: DIDCertificate): Promise<{
        valid: boolean;
        reason?: string;
        trustLevel?: TrustLevel;
    }>;
    getCertificate(certificateId: string): Promise<DIDCertificate | null>;
    getCertificateByDID(did: string): Promise<DIDCertificate[]>;
    getRevocationList(): CertificateRevocationList;
    getCACertificate(): DIDCertificate;
    private verifyCertificateRequest;
    private canIssueTrustLevel;
    private getExtendedKeyUsage;
    private getCAPublicKey;
    private logCertificateEvent;
    getStats(): {
        totalCertificates: number;
        activeCertificates: number;
        revokedCertificates: number;
        expiredCertificates: number;
        certificatesByTrustLevel: Record<string, number>;
    };
}

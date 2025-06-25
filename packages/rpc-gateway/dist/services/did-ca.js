import { randomUUID } from 'crypto';
import { ATPEncryptionService } from '@atp/shared';
import { TrustLevel, TrustLevelManager } from '@atp/shared';
/**
 * ATP™ DID-based Certificate Authority
 * Issues and manages certificates for mutual authentication
 */
export class DIDCertificateAuthority {
    caDID;
    caCertificate;
    caPrivateKey;
    certificates = new Map();
    revocationList;
    constructor(caDID, caPrivateKey) {
        this.caDID = caDID;
        this.caPrivateKey = caPrivateKey || this.generateCAKeyPair();
        this.initializeCA();
    }
    generateCAKeyPair() {
        // In production, this would use a secure key generation process
        const keyPair = ATPEncryptionService.generateKeyPair();
        return keyPair.then(kp => kp.privateKey).catch(() => 'ca-private-key-placeholder');
    }
    async initializeCA() {
        // Create self-signed CA certificate
        const caKeyPair = await ATPEncryptionService.generateKeyPair();
        this.caPrivateKey = caKeyPair.privateKey;
        const now = new Date();
        const validUntil = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
        const caCertData = {
            certificateId: randomUUID(),
            subjectDID: this.caDID,
            issuerDID: this.caDID, // Self-signed
            publicKey: caKeyPair.publicKey,
            keyUsage: ['digitalSignature', 'keyCertSign', 'cRLSign'],
            trustLevel: TrustLevel.ENTERPRISE,
            validFrom: now.toISOString(),
            validUntil: validUntil.toISOString(),
            status: 'active',
            extensions: {
                basicConstraints: {
                    isCA: true,
                    pathLength: 3,
                },
                keyUsage: ['digitalSignature', 'keyCertSign', 'cRLSign'],
                subjectAltName: [`URI:${this.caDID}`],
            },
        };
        const fingerprint = ATPEncryptionService.hash(JSON.stringify(caCertData));
        const signature = await ATPEncryptionService.sign(JSON.stringify(caCertData), this.caPrivateKey);
        this.caCertificate = {
            ...caCertData,
            fingerprint,
            signature,
        };
        // Initialize empty revocation list
        this.revocationList = {
            issuerDID: this.caDID,
            revokedCertificates: [],
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            signature: await ATPEncryptionService.sign(JSON.stringify({ issuerDID: this.caDID, revokedCertificates: [] }), this.caPrivateKey),
        };
        console.log(`ATP™ DID-CA initialized: ${this.caDID}`);
    }
    async issueCertificate(request) {
        // Verify the certificate request
        await this.verifyCertificateRequest(request);
        // Check trust level authorization
        if (!this.canIssueTrustLevel(request.requestedTrustLevel)) {
            throw new Error(`CA cannot issue certificates for trust level: ${request.requestedTrustLevel}`);
        }
        const now = new Date();
        const validUntil = new Date(now.getTime() + request.validityPeriod * 24 * 60 * 60 * 1000);
        const certificateData = {
            certificateId: randomUUID(),
            subjectDID: request.subjectDID,
            issuerDID: this.caDID,
            publicKey: request.publicKey,
            keyUsage: request.keyUsage,
            trustLevel: request.requestedTrustLevel,
            validFrom: now.toISOString(),
            validUntil: validUntil.toISOString(),
            status: 'active',
            extensions: {
                subjectAltName: [`URI:${request.subjectDID}`],
                keyUsage: request.keyUsage,
                extendedKeyUsage: this.getExtendedKeyUsage(request.requestedTrustLevel),
            },
        };
        const fingerprint = ATPEncryptionService.hash(JSON.stringify(certificateData));
        const signature = await ATPEncryptionService.sign(JSON.stringify(certificateData), this.caPrivateKey);
        const certificate = {
            ...certificateData,
            fingerprint,
            signature,
        };
        // Store certificate
        this.certificates.set(certificate.certificateId, certificate);
        // Log certificate issuance
        await this.logCertificateEvent('certificate-issued', {
            certificateId: certificate.certificateId,
            subjectDID: request.subjectDID,
            trustLevel: request.requestedTrustLevel,
            validityPeriod: request.validityPeriod,
        });
        console.log(`Issued certificate ${certificate.certificateId} for ${request.subjectDID}`);
        return certificate;
    }
    async revokeCertificate(certificateId, reason, revokerDID) {
        const certificate = this.certificates.get(certificateId);
        if (!certificate) {
            throw new Error(`Certificate ${certificateId} not found`);
        }
        // Verify revocation authority
        if (revokerDID !== this.caDID && revokerDID !== certificate.subjectDID) {
            throw new Error('Unauthorized certificate revocation');
        }
        // Update certificate status
        certificate.status = 'revoked';
        // Add to revocation list
        this.revocationList.revokedCertificates.push({
            certificateId,
            revocationDate: new Date().toISOString(),
            reason,
        });
        // Update revocation list signature
        this.revocationList.signature = await ATPEncryptionService.sign(JSON.stringify({
            issuerDID: this.revocationList.issuerDID,
            revokedCertificates: this.revocationList.revokedCertificates,
        }), this.caPrivateKey);
        // Log revocation
        await this.logCertificateEvent('certificate-revoked', {
            certificateId,
            reason,
            revokerDID,
        });
        console.log(`Revoked certificate ${certificateId}: ${reason}`);
    }
    async verifyCertificate(certificate) {
        // Check if certificate exists
        const storedCert = this.certificates.get(certificate.certificateId);
        if (!storedCert) {
            return { valid: false, reason: 'Certificate not found' };
        }
        // Check certificate status
        if (storedCert.status !== 'active') {
            return { valid: false, reason: `Certificate status: ${storedCert.status}` };
        }
        // Check validity period
        const now = new Date();
        const validFrom = new Date(certificate.validFrom);
        const validUntil = new Date(certificate.validUntil);
        if (now < validFrom) {
            return { valid: false, reason: 'Certificate not yet valid' };
        }
        if (now > validUntil) {
            // Update status to expired
            storedCert.status = 'expired';
            return { valid: false, reason: 'Certificate expired' };
        }
        // Verify signature
        const certData = {
            certificateId: certificate.certificateId,
            subjectDID: certificate.subjectDID,
            issuerDID: certificate.issuerDID,
            publicKey: certificate.publicKey,
            keyUsage: certificate.keyUsage,
            trustLevel: certificate.trustLevel,
            validFrom: certificate.validFrom,
            validUntil: certificate.validUntil,
            status: certificate.status,
            extensions: certificate.extensions,
        };
        const isValidSignature = await ATPEncryptionService.verify(JSON.stringify(certData), certificate.signature, await this.getCAPublicKey());
        if (!isValidSignature) {
            return { valid: false, reason: 'Invalid certificate signature' };
        }
        // Check revocation list
        const isRevoked = this.revocationList.revokedCertificates.some(revoked => revoked.certificateId === certificate.certificateId);
        if (isRevoked) {
            return { valid: false, reason: 'Certificate revoked' };
        }
        return {
            valid: true,
            trustLevel: certificate.trustLevel,
        };
    }
    async getCertificate(certificateId) {
        return this.certificates.get(certificateId) || null;
    }
    async getCertificateByDID(did) {
        return Array.from(this.certificates.values()).filter(cert => cert.subjectDID === did && cert.status === 'active');
    }
    getRevocationList() {
        return this.revocationList;
    }
    getCACertificate() {
        return this.caCertificate;
    }
    async verifyCertificateRequest(request) {
        // Verify proof of possession of private key
        const isValidProof = await ATPEncryptionService.verify(request.proof.challenge, request.proof.signature, request.publicKey);
        if (!isValidProof) {
            throw new Error('Invalid proof of key possession');
        }
        // Verify DID format
        if (!request.subjectDID.startsWith('did:atp:')) {
            throw new Error('Invalid DID format');
        }
        // Verify key usage
        const validKeyUsages = [
            'digitalSignature',
            'keyEncipherment',
            'keyAgreement',
            'dataEncipherment',
        ];
        if (!request.keyUsage.every(usage => validKeyUsages.includes(usage))) {
            throw new Error('Invalid key usage');
        }
    }
    canIssueTrustLevel(requestedLevel) {
        // CA can issue certificates up to its own trust level
        const caLevel = this.caCertificate.trustLevel;
        return TrustLevelManager.isAuthorized(caLevel, requestedLevel);
    }
    getExtendedKeyUsage(trustLevel) {
        switch (trustLevel) {
            case TrustLevel.BASIC:
                return ['clientAuth'];
            case TrustLevel.VERIFIED:
                return ['clientAuth', 'serverAuth'];
            case TrustLevel.PREMIUM:
                return ['clientAuth', 'serverAuth', 'codeSigning'];
            case TrustLevel.ENTERPRISE:
                return ['clientAuth', 'serverAuth', 'codeSigning', 'timeStamping'];
            default:
                return ['clientAuth'];
        }
    }
    async getCAPublicKey() {
        return this.caCertificate.publicKey;
    }
    async logCertificateEvent(action, details) {
        try {
            await fetch('http://localhost:3005/audit/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: 'did-certificate-authority',
                    action,
                    resource: 'certificate-management',
                    actor: this.caDID,
                    details,
                }),
            });
        }
        catch (error) {
            console.warn('Failed to log certificate event:', error);
        }
    }
    // Statistics and monitoring
    getStats() {
        const certificates = Array.from(this.certificates.values());
        const stats = {
            totalCertificates: certificates.length,
            activeCertificates: 0,
            revokedCertificates: 0,
            expiredCertificates: 0,
            certificatesByTrustLevel: {},
        };
        for (const cert of certificates) {
            switch (cert.status) {
                case 'active':
                    stats.activeCertificates++;
                    break;
                case 'revoked':
                    stats.revokedCertificates++;
                    break;
                case 'expired':
                    stats.expiredCertificates++;
                    break;
            }
            const level = cert.trustLevel;
            stats.certificatesByTrustLevel[level] =
                (stats.certificatesByTrustLevel[level] || 0) + 1;
        }
        return stats;
    }
}

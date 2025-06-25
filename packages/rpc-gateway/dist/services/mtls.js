import https from 'https';
import fs from 'fs';
import { DIDCertificateAuthority } from './did-ca.js';
export class MTLSService {
    config;
    didCA;
    constructor(config, didCA) {
        this.config = config;
        this.didCA = didCA || new DIDCertificateAuthority('did:atp:ca:gateway');
    }
    createHTTPSServer(app) {
        const tlsOptions = {
            ca: this.config.ca,
            cert: this.config.cert,
            key: this.config.key,
            requestCert: this.config.requestCert,
            rejectUnauthorized: this.config.rejectUnauthorized,
        };
        return https.createServer(tlsOptions, app);
    }
    extractClientCertificate(req) {
        const socket = req.socket;
        if (!socket.authorized && this.config.rejectUnauthorized) {
            console.warn('Client certificate not authorized:', socket.authorizationError);
            return null;
        }
        const cert = socket.getPeerCertificate();
        if (!cert || Object.keys(cert).length === 0) {
            return null;
        }
        // Extract DID from certificate subject or SAN
        const did = this.extractDIDFromCertificate(cert);
        return {
            subject: cert.subject,
            issuer: cert.issuer,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            fingerprint: cert.fingerprint,
            fingerprint256: cert.fingerprint256,
            did,
        };
    }
    async validateClientCertificate(certificate) {
        try {
            // Enhanced certificate validation with DID-CA integration
            const validationResult = await this.performEnhancedCertificateValidation(certificate);
            // Update certificate with validation results
            certificate.verified = validationResult.valid;
            certificate.trustLevel = validationResult.trustLevel;
            certificate.verificationError = validationResult.error;
            certificate.didCertificate = validationResult.didCertificate;
            return validationResult.valid;
        }
        catch (error) {
            console.error('Certificate validation failed:', error);
            certificate.verified = false;
            certificate.verificationError = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return false;
        }
    }
    async performEnhancedCertificateValidation(certificate) {
        // Check certificate validity period
        const now = new Date();
        const validFrom = new Date(certificate.valid_from);
        const validTo = new Date(certificate.valid_to);
        if (now < validFrom || now > validTo) {
            return { valid: false, error: 'Certificate validity period check failed' };
        }
        // If DID is present, validate through DID-CA system
        if (certificate.did) {
            const didValidation = await this.validateDIDCertificate(certificate);
            if (!didValidation.valid) {
                return didValidation;
            }
            // Verify certificate fingerprint matches DID document service endpoint
            const isValidBinding = await this.verifyDIDCertificateBinding(certificate.did, certificate.fingerprint256);
            if (!isValidBinding) {
                return { valid: false, error: 'DID-certificate binding verification failed' };
            }
            return didValidation;
        }
        // For non-DID certificates, perform standard validation
        const isRevoked = await this.checkCertificateRevocation(certificate.fingerprint256);
        if (isRevoked) {
            return { valid: false, error: 'Certificate has been revoked' };
        }
        return { valid: true, trustLevel: 'BASIC' };
    }
    async validateDIDCertificate(certificate) {
        try {
            // Get DID certificates from CA
            const didCertificates = await this.didCA.getCertificateByDID(certificate.did);
            if (!didCertificates || didCertificates.length === 0) {
                return { valid: false, error: 'No DID certificates found' };
            }
            // Find matching certificate by fingerprint or public key
            const matchingCert = didCertificates.find(cert => cert.fingerprint === certificate.fingerprint256 ||
                this.certificateMatchesPublicKey(certificate, cert.publicKey));
            if (!matchingCert) {
                return { valid: false, error: 'No matching DID certificate found' };
            }
            // Verify the DID certificate through CA
            const verification = await this.didCA.verifyCertificate(matchingCert);
            if (!verification.valid) {
                return {
                    valid: false,
                    error: verification.reason || 'DID certificate verification failed'
                };
            }
            return {
                valid: true,
                trustLevel: verification.trustLevel,
                didCertificate: matchingCert
            };
        }
        catch (error) {
            return {
                valid: false,
                error: `DID certificate validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    certificateMatchesPublicKey(certificate, publicKey) {
        try {
            // Extract public key from X.509 certificate and compare
            // This is a simplified check - in production, you'd need proper ASN.1 parsing
            const certFingerprint = certificate.fingerprint256;
            const keyHash = require('crypto').createHash('sha256').update(publicKey).digest('hex');
            // For now, we'll rely on fingerprint matching as the primary method
            return certFingerprint.toLowerCase().includes(keyHash.slice(0, 16).toLowerCase());
        }
        catch (error) {
            console.warn('Public key matching failed:', error);
            return false;
        }
    }
    extractDIDFromCertificate(cert) {
        try {
            // Try to extract DID from subject CN
            if (cert.subject?.CN?.startsWith('did:atp:')) {
                return cert.subject.CN;
            }
            // Try to extract DID from subject alternative names
            if (cert.subjectaltname) {
                const sans = cert.subjectaltname.split(', ');
                for (const san of sans) {
                    if (san.startsWith('URI:did:atp:')) {
                        return san.replace('URI:', '');
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('Failed to extract DID from certificate:', error);
            return null;
        }
    }
    async resolveDID(did) {
        try {
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
    async verifyDIDCertificateBinding(did, fingerprint) {
        try {
            const didDocument = await this.resolveDID(did);
            if (!didDocument) {
                return false;
            }
            // Look for service with type 'TLSCertificate' that matches fingerprint
            const tlsServices = didDocument.service?.filter((s) => s.type === 'TLSCertificate' || s.type === 'X509Certificate');
            if (!tlsServices || tlsServices.length === 0) {
                return false;
            }
            // Check if any service matches the certificate fingerprint
            for (const service of tlsServices) {
                if (service.serviceEndpoint?.fingerprint === fingerprint) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('DID-certificate binding verification failed:', error);
            return false;
        }
    }
    async checkCertificateRevocation(fingerprint) {
        // Placeholder for certificate revocation checking
        // In production, implement CRL or OCSP checking
        try {
            // Check against internal revocation list
            // This could be stored in the audit logger or a dedicated service
            const response = await fetch(`http://localhost:3005/audit/events?action=certificate-revoked&resource=${fingerprint}`);
            if (response.ok) {
                const result = await response.json();
                return result.events && result.events.length > 0;
            }
            return false;
        }
        catch (error) {
            console.warn('Could not check certificate revocation status:', error);
            return false;
        }
    }
    // Helper methods for certificate management
    async issueDIDCertificate(did, publicKey, trustLevel) {
        try {
            const request = {
                subjectDID: did,
                publicKey,
                requestedTrustLevel: trustLevel,
                keyUsage: ['digitalSignature', 'keyEncipherment'],
                validityPeriod: 365, // 1 year
                proof: {
                    challenge: `cert-request-${Date.now()}`,
                    signature: await this.generateProofSignature(publicKey, `cert-request-${Date.now()}`)
                }
            };
            return await this.didCA.issueCertificate(request);
        }
        catch (error) {
            console.error('Failed to issue DID certificate:', error);
            throw error;
        }
    }
    async revokeDIDCertificate(certificateId, reason, revokerDID) {
        try {
            await this.didCA.revokeCertificate(certificateId, reason, revokerDID);
            // Log the revocation event
            await this.logCertificateEvent('certificate-revoked', {
                certificateId,
                reason,
                revokerDID
            });
        }
        catch (error) {
            console.error('Failed to revoke DID certificate:', error);
            throw error;
        }
    }
    getDIDCAStats() {
        return this.didCA.getStats();
    }
    getDIDCACertificate() {
        return this.didCA.getCACertificate();
    }
    getRevocationList() {
        return this.didCA.getRevocationList();
    }
    async generateProofSignature(publicKey, challenge) {
        try {
            // In production, this would be signed by the actual private key
            // For now, we'll create a mock signature
            const { ATPEncryptionService } = await import('@atp/shared');
            const keyPair = await ATPEncryptionService.generateKeyPair();
            return await ATPEncryptionService.sign(challenge, keyPair.privateKey);
        }
        catch (error) {
            console.warn('Failed to generate proof signature:', error);
            return 'mock-signature';
        }
    }
    async logCertificateEvent(action, details) {
        try {
            await fetch('http://localhost:3005/audit/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: 'mtls-service',
                    action,
                    resource: 'certificate-management',
                    actor: 'rpc-gateway',
                    details,
                }),
            });
        }
        catch (error) {
            console.warn('Failed to log certificate event:', error);
        }
    }
    static loadTLSConfig(configPath) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                ca: config.ca.map((caPath) => fs.readFileSync(caPath, 'utf8')),
                cert: fs.readFileSync(config.cert, 'utf8'),
                key: fs.readFileSync(config.key, 'utf8'),
                requestCert: config.requestCert ?? true,
                rejectUnauthorized: config.rejectUnauthorized ?? false,
            };
        }
        catch (error) {
            console.error('Failed to load TLS configuration:', error);
            throw error;
        }
    }
}

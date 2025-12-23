import { VerifiableCredential, CredentialIssuanceRequest, CredentialVerificationRequest, VerificationResult, CredentialSchema, Proof } from '../models/credential.js';
import { CryptoUtils } from '../utils/crypto.js';
import { StorageService } from './storage.js';
import { randomUUID } from 'crypto';

export class CredentialService {
  constructor(private storage: StorageService) {}

  async issueCredential(request: CredentialIssuanceRequest): Promise<VerifiableCredential> {
    const schema = await this.storage.getSchema(request.schemaId);
    if (!schema) {
      throw new Error(`Schema ${request.schemaId} not found`);
    }

    this.validateClaims(request.claims, schema);

    const credentialId = `urn:uuid:${randomUUID()}`;
    const now = new Date().toISOString();
    
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', schema.name],
      issuer: request.issuerDid,
      issuanceDate: now,
      expirationDate: request.expirationDate,
      credentialSubject: {
        id: request.subject,
        ...request.claims,
      },
    };

    const proof = await this.signCredential(credential, request.issuerDid, request.issuerPrivateKey);
    credential.proof = proof;

    await this.storage.storeCredential(credential);
    
    return credential;
  }

  async verifyCredential(request: CredentialVerificationRequest): Promise<VerificationResult> {
    const { credential } = request;
    
    const checks = {
      signature: false,
      expiration: false,
      revocation: false,
      schema: false,
    };

    try {
      checks.signature = await this.verifySignature(credential);
      checks.expiration = this.checkExpiration(credential);
      checks.revocation = await this.checkRevocation(credential);
      checks.schema = await this.validateCredentialSchema(credential);

      const valid = Object.values(checks).every(check => check);

      return {
        valid,
        checks,
        error: valid ? undefined : 'Credential verification failed',
      };
    } catch (error) {
      return {
        valid: false,
        checks,
        error: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  async revokeCredential(credentialId: string, issuerDid: string): Promise<void> {
    const credential = await this.storage.getCredential(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const issuer = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    if (issuer !== issuerDid) {
      throw new Error('Only the issuer can revoke this credential');
    }

    await this.storage.revokeCredential(credentialId);
  }

  async registerSchema(schema: CredentialSchema): Promise<void> {
    await this.storage.storeSchema(schema);
  }

  async getSchema(schemaId: string): Promise<CredentialSchema | null> {
    return await this.storage.getSchema(schemaId);
  }

  async listSchemas(): Promise<CredentialSchema[]> {
    return await this.storage.listSchemas();
  }

  private async signCredential(credential: VerifiableCredential, issuerDid: string, privateKey: string): Promise<Proof> {
    const canonicalized = this.canonicalizeCredential(credential);
    const signature = await CryptoUtils.sign(canonicalized, privateKey);
    
    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDid}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: signature,
    };
  }

  private async verifySignature(credential: VerifiableCredential): Promise<boolean> {
    if (!credential.proof) {
      return false;
    }

    const { proof, ...credentialWithoutProof } = credential;
    const canonicalized = this.canonicalizeCredential(credentialWithoutProof);
    
    const issuer = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    const publicKey = await this.getPublicKeyForDID(issuer);
    
    if (!publicKey) {
      return false;
    }

    return await CryptoUtils.verify(canonicalized, proof.proofValue, publicKey);
  }

  private checkExpiration(credential: VerifiableCredential): boolean {
    if (!credential.expirationDate) {
      return true;
    }
    
    return new Date(credential.expirationDate) > new Date();
  }

  private async checkRevocation(credential: VerifiableCredential): Promise<boolean> {
    if (!credential.credentialStatus) {
      return true;
    }

    return !(await this.storage.isCredentialRevoked(credential.id));
  }

  private async validateCredentialSchema(credential: VerifiableCredential): Promise<boolean> {
    const schemaType = credential.type.find(t => t !== 'VerifiableCredential');
    if (!schemaType) {
      return false;
    }

    const schema = await this.storage.getSchemaByName(schemaType);
    if (!schema) {
      return false;
    }

    return this.validateClaims(credential.credentialSubject, schema);
  }

  private validateClaims(claims: Record<string, any>, schema: CredentialSchema): boolean {
    for (const [key, property] of Object.entries(schema.properties)) {
      if (property.required && !(key in claims)) {
        throw new Error(`Required property ${key} missing`);
      }
      
      if (key in claims && !this.validatePropertyType(claims[key], property.type)) {
        throw new Error(`Property ${key} has invalid type`);
      }
    }
    
    return true;
  }

  private validatePropertyType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private canonicalizeCredential(credential: Partial<VerifiableCredential>): string {
    return JSON.stringify(credential, Object.keys(credential).sort());
  }

  private async getPublicKeyForDID(did: string): Promise<string | null> {
    return ''; // This would integrate with the Identity Service
  }
}
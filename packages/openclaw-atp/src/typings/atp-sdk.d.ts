/**
 * Type declarations for atp-sdk
 * These are stub types for compilation. The actual types come from the atp-sdk package at runtime.
 */
declare module 'atp-sdk' {
  export interface ATPClient {
    identity: {
      register(options: any): Promise<any>;
      registerAgent(options: any): Promise<any>;
      resolve(did: string): Promise<any>;
      getDID(did: string): Promise<any>;
      updateTrustLevel(options: any): Promise<any>;
      [key: string]: (...args: any[]) => Promise<any>;
    };
    trust: {
      getScore(did: string): Promise<number>;
      evaluate(did: string): Promise<{ trustLevel: TrustLevel; score: number }>;
      [key: string]: (...args: any[]) => Promise<any>;
    };
    permissions: {
      check(options: any): Promise<boolean>;
      checkAccess(options: any): Promise<any>;
      grant(options: any): Promise<void>;
      getPolicy(id: string): Promise<any>;
      createPolicy(options: any): Promise<any>;
      [key: string]: (...args: any[]) => Promise<any>;
    };
    audit: {
      log(event: any): Promise<any>;
      query(options: any): Promise<any>;
      getEvents(query: any): Promise<AuditEvent[]>;
      [key: string]: (...args: any[]) => Promise<any>;
    };
    credentials: {
      issue(options: any): Promise<any>;
      verify(credential: any): Promise<boolean>;
      [key: string]: (...args: any[]) => Promise<any>;
    };
    config: ATPConfig;
  }

  export type TrustLevel = 'unverified' | 'basic' | 'verified' | 'trusted' | 'enterprise';

  export interface AuditEvent {
    id: string;
    timestamp: string;
    eventType: string;
    agentDid?: string;
    severity?: string;
    metadata?: Record<string, any>;
  }

  export interface Permission {
    action: string;
    resource: string;
    effect: 'allow' | 'deny';
    conditions?: Record<string, any>;
  }

  export interface DIDDocument {
    id: string;
    controller?: string;
    verificationMethod?: any[];
    authentication?: any[];
    service?: any[];
  }

  export interface ATPConfig {
    baseUrl?: string;
    apiKey?: string;
    trustThreshold?: number;
    auditEnabled?: boolean;
    quantumSafe?: boolean;
    timeout?: number;
    [key: string]: any;
  }

  export interface KeyPairBytes {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  /** Split hybrid key pair: independent Ed25519 and ML-DSA-65 keys (v2). */
  export interface HybridKeyPair {
    ed25519: KeyPairBytes;
    mlDsa65: KeyPairBytes;
  }

  export type AtpDidType = 'root' | 'path';

  export interface ParsedAtpDid {
    did: string;
    type: AtpDidType;
    domain: string;
    path: string[];
    e1?: string;
    pq1?: string;
    fragment?: string;
  }

  export class DidAtp {
    static readonly METHOD: string;
    static readonly PREFIX: string;
    static fromPublicKeys(...args: any[]): string;
    static rootDid(domain: string): string;
    static generate(...args: any[]): Promise<any>;
    static parse(input: string): ParsedAtpDid | null;
  }

  export class DidAtpDocument {
    constructor(...args: any[]);
    [key: string]: any;
  }

  export class DidAtpResolver {
    constructor(...args: any[]);
    resolve(did: string): Promise<any>;
    [key: string]: any;
  }
}

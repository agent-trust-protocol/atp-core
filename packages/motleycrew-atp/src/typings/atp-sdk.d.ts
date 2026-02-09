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
}

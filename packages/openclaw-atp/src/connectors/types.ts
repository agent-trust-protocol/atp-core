/**
 * Connector Types
 */

export interface ConnectorConfig {
  /** ATP client for security */
  atpEnabled: boolean;

  /** Connection timeout */
  timeout?: number;

  /** Retry configuration */
  retries?: number;

  /** Enable audit logging */
  auditEnabled?: boolean;
}

export interface CredentialScope {
  /** Resource pattern */
  resource: string;

  /** Allowed actions */
  actions: string[];

  /** Expiry time */
  expiresAt?: Date;

  /** Additional constraints */
  constraints?: Record<string, any>;
}

export interface ExternalServiceConfig {
  /** Service name */
  name: string;

  /** Service URL */
  url: string;

  /** Authentication method */
  authMethod: 'token' | 'oauth' | 'api-key' | 'certificate';

  /** Allow-list patterns */
  allowList?: string[];

  /** DLP enabled */
  dlpEnabled?: boolean;

  /** Rate limits */
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

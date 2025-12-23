import { z } from 'zod';

// A2A (Agent-to-Agent) Protocol Types for ATP™ Integration
// Based on Google's A2A specification with ATP™ trust and security enhancements

export const A2AAgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  parameters: z.record(z.any()).optional(),
  // ATP™ Security Extensions
  trustLevelRequired: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const A2AAgentProfileSchema = z.object({
  did: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  endpoints: z.object({
    discovery: z.string(),
    communication: z.string(),
    status: z.string().optional(),
  }),
  capabilities: z.array(A2AAgentCapabilitySchema),
  metadata: z.object({
    created: z.string(),
    updated: z.string(),
    owner: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  // ATP™ Security Extensions
  atpProfile: z.object({
    trustLevel: z.string(),
    verificationStatus: z.string(),
    capabilities: z.array(z.string()),
    lastVerified: z.string(),
    reputation: z.object({
      score: z.number().min(0).max(100),
      interactions: z.number(),
      successRate: z.number().min(0).max(1),
    }).optional(),
    securityFeatures: z.object({
      encryption: z.boolean(),
      authentication: z.boolean(),
      auditLogging: z.boolean(),
      rateLimiting: z.boolean(),
    }).optional(),
  }),
});

export const A2ADiscoveryRequestSchema = z.object({
  query: z.object({
    capabilities: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    trustLevel: z.string().optional(),
    location: z.string().optional(),
    availability: z.string().optional(),
  }).optional(),
  filters: z.object({
    minTrustLevel: z.string().optional(),
    maxResponseTime: z.number().optional(),
    verifiedOnly: z.boolean().optional(),
    activeOnly: z.boolean().optional(),
  }).optional(),
  pagination: z.object({
    offset: z.number().default(0),
    limit: z.number().default(50),
  }).optional(),
  // ATP™ Security Context
  requester: z.object({
    did: z.string(),
    trustLevel: z.string(),
    purpose: z.string(),
    sessionId: z.string(),
  }),
});

export const A2ADiscoveryResponseSchema = z.object({
  agents: z.array(A2AAgentProfileSchema),
  pagination: z.object({
    offset: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  query: A2ADiscoveryRequestSchema.shape.query.optional(),
  metadata: z.object({
    searchTime: z.number(),
    timestamp: z.string(),
    source: z.string(),
  }),
});

export const A2ACommunicationRequestSchema = z.object({
  from: z.string(), // Sender DID
  to: z.string(),   // Recipient DID
  messageType: z.enum(['handshake', 'task-request', 'task-response', 'status-update', 'error', 'custom']),
  content: z.record(z.any()),
  metadata: z.object({
    messageId: z.string(),
    timestamp: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    expiresAt: z.string().optional(),
    replyTo: z.string().optional(),
  }),
  // ATP™ Security Extensions
  atpSecurity: z.object({
    encrypted: z.boolean(),
    signed: z.boolean(),
    trustVerified: z.boolean(),
    auditRequired: z.boolean().default(true),
  }),
});

export const A2ACommunicationResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  timestamp: z.string(),
  response: z.record(z.any()).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }).optional(),
});

export const A2AHandshakeRequestSchema = z.object({
  initiator: z.object({
    did: z.string(),
    profile: A2AAgentProfileSchema,
    intendedPurpose: z.string(),
  }),
  target: z.object({
    did: z.string(),
    expectedCapabilities: z.array(z.string()),
  }),
  security: z.object({
    proposedProtocols: z.array(z.string()),
    encryptionRequired: z.boolean(),
    mutualAuthentication: z.boolean(),
  }),
  sessionParameters: z.object({
    timeout: z.number().default(300), // 5 minutes
    maxMessages: z.number().default(1000),
    auditLevel: z.enum(['minimal', 'standard', 'detailed']).default('standard'),
  }),
});

export const A2AHandshakeResponseSchema = z.object({
  accepted: z.boolean(),
  sessionId: z.string().optional(),
  responder: z.object({
    did: z.string(),
    profile: A2AAgentProfileSchema,
  }).optional(),
  agreedProtocols: z.array(z.string()).optional(),
  sessionParameters: z.object({
    timeout: z.number(),
    maxMessages: z.number(),
    auditLevel: z.string(),
    endpoints: z.object({
      communication: z.string(),
      status: z.string(),
    }),
  }).optional(),
  rejection: z.object({
    reason: z.string(),
    code: z.string(),
    suggestedAlternatives: z.array(z.string()).optional(),
  }).optional(),
});

export type A2AAgentCapability = z.infer<typeof A2AAgentCapabilitySchema>;
export type A2AAgentProfile = z.infer<typeof A2AAgentProfileSchema>;
export type A2ADiscoveryRequest = z.infer<typeof A2ADiscoveryRequestSchema>;
export type A2ADiscoveryResponse = z.infer<typeof A2ADiscoveryResponseSchema>;
export type A2ACommunicationRequest = z.infer<typeof A2ACommunicationRequestSchema>;
export type A2ACommunicationResponse = z.infer<typeof A2ACommunicationResponseSchema>;
export type A2AHandshakeRequest = z.infer<typeof A2AHandshakeRequestSchema>;
export type A2AHandshakeResponse = z.infer<typeof A2AHandshakeResponseSchema>;

// ATP™ Enhanced A2A Session
export interface A2ASession {
  sessionId: string;
  participants: {
    initiator: string; // DID
    responder: string; // DID
  };
  status: 'pending' | 'active' | 'paused' | 'terminated' | 'error';
  security: {
    protocols: string[];
    encrypted: boolean;
    authenticated: boolean;
  };
  metrics: {
    startTime: string;
    lastActivity: string;
    messageCount: number;
    errorCount: number;
  };
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actor: string;
    details: Record<string, any>;
  }>;
}

// A2A Error Codes
export enum A2AErrorCode {
  // Discovery Errors
  DISCOVERY_SERVICE_UNAVAILABLE = 'A2A_1001',
  INVALID_DISCOVERY_QUERY = 'A2A_1002',
  NO_AGENTS_FOUND = 'A2A_1003',
  
  // Communication Errors
  AGENT_UNREACHABLE = 'A2A_2001',
  HANDSHAKE_FAILED = 'A2A_2002',
  MESSAGE_DELIVERY_FAILED = 'A2A_2003',
  SESSION_EXPIRED = 'A2A_2004',
  
  // Security Errors
  AUTHENTICATION_FAILED = 'A2A_3001',
  AUTHORIZATION_DENIED = 'A2A_3002',
  TRUST_VERIFICATION_FAILED = 'A2A_3003',
  ENCRYPTION_ERROR = 'A2A_3004',
  
  // ATP™ Specific Errors
  INSUFFICIENT_TRUST_LEVEL = 'ATP_4001',
  CAPABILITY_NOT_AVAILABLE = 'ATP_4002',
  AUDIT_LOGGING_FAILED = 'ATP_4003',
  RATE_LIMIT_EXCEEDED = 'ATP_4004',
}
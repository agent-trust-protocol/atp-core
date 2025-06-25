import { z } from 'zod';

// MCP (Model Context Protocol) Types for ATP™ Integration
// Based on Anthropic's MCP specification with ATP™ security enhancements

export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.any()).optional(),
  id: z.union([z.string(), z.number()]),
});

export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
  id: z.union([z.string(), z.number()]),
});

export const MCPNotificationSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.any()).optional(),
});

// ATP™ Enhanced MCP Tool Definition
export const ATPMCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()).optional(),
  // ATP™ Security Extensions
  trustLevelRequired: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  auditRequired: z.boolean().default(true),
  rateLimits: z.object({
    requestsPerMinute: z.number().optional(),
    requestsPerHour: z.number().optional(),
  }).optional(),
});

// ATP™ Enhanced MCP Resource Definition
export const ATPMCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  // ATP™ Security Extensions
  accessControl: z.object({
    trustLevelRequired: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    ownerDID: z.string().optional(),
  }).optional(),
});

// ATP™ Enhanced MCP Server Configuration
export const ATPMCPServerConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  capabilities: z.object({
    tools: z.object({
      listChanged: z.boolean().optional(),
    }).optional(),
    resources: z.object({
      subscribe: z.boolean().optional(),
      listChanged: z.boolean().optional(),
    }).optional(),
    prompts: z.object({
      listChanged: z.boolean().optional(),
    }).optional(),
    logging: z.object({
      level: z.enum(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency']).optional(),
    }).optional(),
  }).optional(),
  // ATP™ Security Extensions
  atpConfig: z.object({
    serverDID: z.string(),
    trustLevel: z.string(),
    supportedAuthMethods: z.array(z.enum(['did-signature', 'did-jwt', 'mtls'])),
    auditEndpoint: z.string().optional(),
    rateLimits: z.object({
      globalRequestsPerMinute: z.number().optional(),
      perClientRequestsPerMinute: z.number().optional(),
    }).optional(),
  }),
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
export type MCPNotification = z.infer<typeof MCPNotificationSchema>;
export type ATPMCPTool = z.infer<typeof ATPMCPToolSchema>;
export type ATPMCPResource = z.infer<typeof ATPMCPResourceSchema>;
export type ATPMCPServerConfig = z.infer<typeof ATPMCPServerConfigSchema>;

// ATP™ MCP Authentication Context
export interface MCPAuthContext {
  clientDID: string;
  trustLevel: string;
  capabilities: string[];
  authenticated: boolean;
  authMethod: 'did-signature' | 'did-jwt' | 'mtls';
  sessionId: string;
}

// ATP™ MCP Tool Execution Context
export interface MCPToolContext {
  auth: MCPAuthContext;
  tool: ATPMCPTool;
  requestId: string | number;
  startTime: number;
  auditRequired: boolean;
}

// MCP Error Codes (standard + ATP™ extensions)
export enum MCPErrorCode {
  // Standard MCP Error Codes
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // ATP™ Extended Error Codes
  AUTHENTICATION_REQUIRED = -32001,
  INSUFFICIENT_TRUST_LEVEL = -32002,
  MISSING_CAPABILITY = -32003,
  RATE_LIMIT_EXCEEDED = -32004,
  AUDIT_FAILURE = -32005,
  TOOL_ACCESS_DENIED = -32006,
}
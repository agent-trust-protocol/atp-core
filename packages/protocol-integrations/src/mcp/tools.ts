import { ATPMCPTool } from '../types/mcp.js';
import { TrustLevel } from '@atp/shared';

// Example ATP™ enhanced MCP tools demonstrating different security levels

export const EXAMPLE_TOOLS: ATPMCPTool[] = [
  {
    name: 'weather_info',
    description: 'Get current weather information for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The location to get weather for',
        },
        units: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature units',
          default: 'celsius',
        },
      },
      required: ['location'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        temperature: { type: 'number' },
        description: { type: 'string' },
        humidity: { type: 'number' },
        location: { type: 'string' },
      },
    },
    // Public tool - minimal trust required
    trustLevelRequired: TrustLevel.UNTRUSTED,
    capabilities: ['read-public'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
    },
  },

  {
    name: 'file_read',
    description: 'Read contents of a file (requires basic trust)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read',
        },
        encoding: {
          type: 'string',
          enum: ['utf8', 'base64'],
          default: 'utf8',
        },
      },
      required: ['path'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        size: { type: 'number' },
        path: { type: 'string' },
      },
    },
    // Requires basic trust for file access
    trustLevelRequired: TrustLevel.BASIC,
    capabilities: ['basic-operations', 'file-read'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
    },
  },

  {
    name: 'database_query',
    description: 'Execute a database query (requires verified trust)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute',
        },
        database: {
          type: 'string',
          description: 'Database name',
        },
        parameters: {
          type: 'object',
          description: 'Query parameters',
        },
      },
      required: ['query', 'database'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        rows: { type: 'array' },
        rowCount: { type: 'number' },
        executionTime: { type: 'number' },
      },
    },
    // Requires verified trust for database access
    trustLevelRequired: TrustLevel.VERIFIED,
    capabilities: ['credential-operations', 'database-access'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
    },
  },

  {
    name: 'system_command',
    description: 'Execute system commands (requires premium trust)',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'System command to execute',
        },
        workingDirectory: {
          type: 'string',
          description: 'Working directory for command execution',
        },
        timeout: {
          type: 'number',
          description: 'Command timeout in seconds',
          default: 30,
        },
      },
      required: ['command'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        exitCode: { type: 'number' },
        executionTime: { type: 'number' },
      },
    },
    // Requires premium trust for system access
    trustLevelRequired: TrustLevel.PREMIUM,
    capabilities: ['advanced-operations', 'system-access'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 5,
      requestsPerHour: 50,
    },
  },

  {
    name: 'admin_user_management',
    description: 'Manage user accounts and permissions (requires enterprise trust)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'delete', 'modify', 'list'],
          description: 'Action to perform',
        },
        userDID: {
          type: 'string',
          description: 'Target user DID',
        },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Permissions to grant/revoke',
        },
      },
      required: ['action'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        affectedUsers: { type: 'array' },
      },
    },
    // Requires enterprise trust for admin operations
    trustLevelRequired: TrustLevel.ENTERPRISE,
    capabilities: ['admin-operations', 'system-management'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 2,
      requestsPerHour: 20,
    },
  },

  {
    name: 'policy_deploy',
    description: 'Deploy quantum-safe trust policy to ATP Gateway',
    inputSchema: {
      type: 'object',
      properties: {
        policy: {
          type: 'object',
          properties: {
            if: { type: 'object' },
            then: { type: 'string' },
            rules: { type: 'array' }
          }
        },
        orgId: {
          type: 'string',
          pattern: '^did:atp:org:'
        },
        quantumSignature: {
          type: 'string',
          description: 'Dilithium-based policy signature using hybrid Ed25519 + CRYSTALS-Dilithium'
        }
      },
      required: ['policy', 'orgId', 'quantumSignature']
    },
    outputSchema: {
      type: 'object',
      properties: {
        deployedAt: { type: 'string', format: 'date-time' },
        policyHash: { type: 'string' },
        gatewayResponse: { type: 'object' }
      }
    },
    trustLevelRequired: TrustLevel.VERIFIED,
    capabilities: ['policy-management', 'quantum-safe-operations'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerHour: 100
    }
  },

  {
    name: 'atp_identity_lookup',
    description: 'Look up ATP™ agent identity information',
    inputSchema: {
      type: 'object',
      properties: {
        did: {
          type: 'string',
          description: 'DID to look up',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include trust level and metadata',
          default: false,
        },
      },
      required: ['did'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        did: { type: 'string' },
        document: { type: 'object' },
        trustLevel: { type: 'string' },
        capabilities: { type: 'array' },
        metadata: { type: 'object' },
      },
    },
    // Requires basic trust for identity lookup
    trustLevelRequired: TrustLevel.BASIC,
    capabilities: ['basic-operations', 'identity-read'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
    },
  },

  {
    name: 'atp_audit_query',
    description: 'Query ATP™ audit logs (requires verified trust)',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Source service to query',
        },
        action: {
          type: 'string',
          description: 'Action to filter by',
        },
        actor: {
          type: 'string',
          description: 'Actor DID to filter by',
        },
        startTime: {
          type: 'string',
          description: 'Start time for query (ISO string)',
        },
        endTime: {
          type: 'string',
          description: 'End time for query (ISO string)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 100,
        },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        events: { type: 'array' },
        total: { type: 'number' },
        query: { type: 'object' },
      },
    },
    // Requires verified trust for audit access
    trustLevelRequired: TrustLevel.VERIFIED,
    capabilities: ['audit-read', 'credential-operations'],
    auditRequired: true,
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
    },
  },
];
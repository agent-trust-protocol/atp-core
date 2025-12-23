/**
 * Visual Trust Policy Schema Tests
 * 
 * Comprehensive test suite for the ATP Visual Policy JSON Schema
 * Tests all condition types, action types, logical operators, and validation
 */

import { describe, it, expect } from '@jest/globals';
import { randomUUID } from 'crypto';
import {
  // Schema validators
  validateATPPolicy,
  validatePolicyRule,
  validatePolicyCondition,
  validatePolicyAction,
  validatePartialPolicy,
  
  // Policy templates
  createAllowAllPolicyTemplate,
  createSecurityPolicyTemplate,
  
  // Types
  ATPVisualPolicy,
  VisualPolicyRule,
  VisualPolicyCondition,
  VisualPolicyActionType,
  VisualPolicyLogicalExpression,
  VisualPolicyTrustLevel,
  
  // Schemas
  ATPVisualPolicySchema,
  VisualPolicyRuleSchema,
  VisualPolicyConditionSchema,
  VisualPolicyActionSchema,
  VisualPolicyLogicalExpressionSchema
} from '../visual-policy-schema.js';

describe('Visual Policy Schema - Core Types', () => {
  describe('Trust Levels', () => {
    it('should validate all trust levels', () => {
      const validTrustLevels: VisualPolicyTrustLevel[] = [
        'UNKNOWN', 'BASIC', 'VERIFIED', 'TRUSTED', 'PRIVILEGED'
      ];
      
      validTrustLevels.forEach(level => {
        expect(() => {
          const condition: VisualPolicyCondition = {
            id: randomUUID(),
            type: 'trust_level',
            operator: 'equals',
            value: level
          };
          validatePolicyCondition(condition);
        }).not.toThrow();
      });
    });
  });

  describe('Action Types', () => {
    it('should validate all action types', () => {
      const actions = [
        { id: randomUUID(), type: 'allow' },
        { id: randomUUID(), type: 'deny' },
        { id: randomUUID(), type: 'throttle', limits: { requestsPerMinute: 10 } },
        { id: randomUUID(), type: 'log' },
        { id: randomUUID(), type: 'alert', channels: ['email'], recipients: ['test@example.com'] },
        { id: randomUUID(), type: 'require_approval', approvers: ['did:atp:admin'] }
      ];
      
      actions.forEach(action => {
        expect(() => {
          validatePolicyAction(action as VisualPolicyActionType);
        }).not.toThrow();
      });
    });
  });
});

describe('Visual Policy Schema - Conditions', () => {
  describe('Agent DID Condition', () => {
    it('should validate single DID condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'agent_did',
        operator: 'equals',
        value: 'did:atp:123456789abcdef'
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });

    it('should validate multiple DID condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'agent_did',
        operator: 'in_list',
        value: ['did:atp:123', 'did:atp:456', 'did:atp:789']
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Trust Level Condition', () => {
    it('should validate trust level enum condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'trust_level',
        operator: 'greater_than_or_equal',
        value: 'VERIFIED'
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });

    it('should validate numeric trust score condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'trust_level',
        operator: 'greater_than',
        value: 3
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });

    it('should validate trust level array condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'trust_level',
        operator: 'in_list',
        value: ['VERIFIED', 'TRUSTED', 'PRIVILEGED']
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Verifiable Credential Condition', () => {
    it('should validate VC condition with all fields', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'verifiable_credential',
        operator: 'contains',
        value: {
          credentialType: 'com.atp.security.certified',
          issuer: 'did:atp:issuer123',
          schemaId: 'security-cert-v1',
          claims: {
            level: 'advanced',
            expires: '2025-12-31'
          },
          expirationCheck: true
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });

    it('should validate minimal VC condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'verifiable_credential',
        operator: 'contains',
        value: {
          credentialType: 'com.atp.basic',
          expirationCheck: true
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Tool Condition', () => {
    it('should validate simple tool condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'tool',
        operator: 'equals',
        value: 'database_query'
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });

    it('should validate complex tool condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'tool',
        operator: 'equals',
        value: {
          toolId: 'api_gateway',
          toolType: 'api',
          endpoint: '/v1/sensitive-data',
          method: 'POST',
          sensitivity: 'confidential'
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Time Condition', () => {
    it('should validate time-based condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'time',
        operator: 'equals',
        value: {
          startTime: '09:00:00',
          endTime: '17:00:00',
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          timezone: 'America/New_York'
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Context Condition', () => {
    it('should validate context condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'context',
        operator: 'equals',
        value: {
          ipAddress: '192.168.1.100',
          userAgent: 'ATP-Agent/1.0',
          location: {
            country: 'US',
            region: 'CA',
            city: 'San Francisco'
          },
          sessionAge: 30,
          riskScore: 15
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });

  describe('Organization Condition', () => {
    it('should validate organization condition', () => {
      const condition: VisualPolicyCondition = {
        id: randomUUID(),
        type: 'organization',
        operator: 'equals',
        value: {
          orgId: 'org_123456',
          orgType: 'enterprise',
          tier: 'premium'
        }
      };
      
      expect(() => validatePolicyCondition(condition)).not.toThrow();
    });
  });
});

describe('Visual Policy Schema - Logical Expressions', () => {
  it('should validate AND expression', () => {
    const expression: VisualPolicyLogicalExpression = {
      id: randomUUID(),
      operator: 'AND',
      operands: [
        {
          id: randomUUID(),
          type: 'trust_level',
          operator: 'greater_than_or_equal',
          value: 'VERIFIED'
        },
        {
          id: randomUUID(),
          type: 'tool',
          operator: 'equals',
          value: 'database'
        }
      ]
    };
    
    expect(() => VisualPolicyLogicalExpressionSchema.parse(expression)).not.toThrow();
  });

  it('should validate nested logical expressions', () => {
    const expression: VisualPolicyLogicalExpression = {
      id: randomUUID(),
      operator: 'OR',
      operands: [
        {
          id: randomUUID(),
          type: 'trust_level',
          operator: 'equals',
          value: 'PRIVILEGED'
        },
        {
          id: randomUUID(),
          operator: 'AND',
          operands: [
            {
              id: randomUUID(),
              type: 'trust_level',
              operator: 'equals',
              value: 'TRUSTED'
            },
            {
              id: randomUUID(),
              type: 'verifiable_credential',
              operator: 'contains',
              value: {
                credentialType: 'com.atp.admin'
              }
            }
          ]
        }
      ]
    };
    
    expect(() => VisualPolicyLogicalExpressionSchema.parse(expression)).not.toThrow();
  });
});

describe('Visual Policy Schema - Actions', () => {
  describe('Allow Action', () => {
    it('should validate allow action with conditions', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'allow',
        conditions: {
          timeLimit: 60,
          usageLimit: 10,
          requireMFA: true
        }
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });

    it('should validate simple allow action', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'allow'
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });
  });

  describe('Deny Action', () => {
    it('should validate deny action', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'deny',
        reason: 'Insufficient trust level',
        notifyAdmin: true
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });
  });

  describe('Throttle Action', () => {
    it('should validate throttle action', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'throttle',
        limits: {
          requestsPerMinute: 10,
          requestsPerHour: 100,
          requestsPerDay: 1000,
          burstLimit: 5
        }
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });
  });

  describe('Alert Action', () => {
    it('should validate alert action', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'alert',
        severity: 'high',
        channels: ['email', 'slack'],
        recipients: ['admin@company.com', '#security-alerts'],
        message: 'Suspicious access attempt detected'
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });
  });

  describe('Require Approval Action', () => {
    it('should validate require approval action', () => {
      const action: VisualPolicyActionType = {
        id: randomUUID(),
        type: 'require_approval',
        approvers: ['did:atp:admin1', 'did:atp:admin2'],
        timeout: 3600,
        autoApproveAfter: 7200
      };
      
      expect(() => validatePolicyAction(action)).not.toThrow();
    });
  });
});

describe('Visual Policy Schema - Complete Policy', () => {
  it('should validate complete policy', () => {
    const now = new Date().toISOString();
    const policy: ATPVisualPolicy = {
      id: randomUUID(),
      name: 'Test Policy',
      description: 'A test policy for validation',
      version: '1.0.0',
      organizationId: 'org_test',
      createdBy: 'did:atp:creator',
      createdAt: now,
      updatedAt: now,
      enabled: true,
      defaultAction: 'deny',
      evaluationMode: 'priority_order',
      rules: [{
        id: randomUUID(),
        name: 'Test Rule',
        description: 'A test rule',
        enabled: true,
        priority: 100,
        condition: {
          id: randomUUID(),
          type: 'trust_level',
          operator: 'greater_than_or_equal',
          value: 'BASIC'
        },
        action: {
          id: randomUUID(),
          type: 'allow'
        },
        tags: ['test'],
        createdAt: now,
        updatedAt: now,
        createdBy: 'did:atp:creator',
        version: '1.0.0'
      }],
      tags: ['test'],
      testCases: [],
      auditLog: [{
        timestamp: now,
        action: 'created',
        actor: 'did:atp:creator',
        reason: 'Test policy creation'
      }]
    };
    
    expect(() => validateATPPolicy(policy)).not.toThrow();
  });

  it('should reject invalid policy', () => {
    const invalidPolicy = {
      name: 'Invalid Policy',
      // Missing required fields
    };
    
    expect(() => validateATPPolicy(invalidPolicy)).toThrow();
  });
});

describe('Visual Policy Schema - Templates', () => {
  describe('Allow All Template', () => {
    it('should create valid allow all policy', () => {
      const policy = createAllowAllPolicyTemplate('org_test', 'did:atp:creator');
      
      expect(() => validateATPPolicy(policy)).not.toThrow();
      expect(policy.name).toBe('Allow All Access');
      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0].action.type).toBe('allow');
    });
  });

  describe('Security Template', () => {
    it('should create valid security policy', () => {
      const policy = createSecurityPolicyTemplate('org_test', 'did:atp:creator');
      
      expect(() => validateATPPolicy(policy)).not.toThrow();
      expect(policy.name).toBe('Security Policy');
      expect(policy.category).toBe('security');
      expect(policy.rules).toHaveLength(1);
    });
  });
});

describe('Visual Policy Schema - Validation Utilities', () => {
  it('should validate partial policy', () => {
    const partialPolicy = {
      name: 'Partial Policy',
      enabled: false
    };
    
    expect(() => validatePartialPolicy(partialPolicy)).not.toThrow();
  });

  it('should validate individual rule', () => {
    const now = new Date().toISOString();
    const rule: VisualPolicyRule = {
      id: randomUUID(),
      name: 'Test Rule',
      enabled: true,
      priority: 100,
      condition: {
        id: randomUUID(),
        type: 'trust_level',
        operator: 'equals',
        value: 'VERIFIED'
      },
      action: {
        id: randomUUID(),
        type: 'allow'
      },
      tags: [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'did:atp:creator',
      version: '1.0.0'
    };
    
    expect(() => validatePolicyRule(rule)).not.toThrow();
  });
});

describe('Visual Policy Schema - Error Cases', () => {
  it('should reject invalid trust level', () => {
    const condition = {
      id: randomUUID(),
      type: 'trust_level',
      operator: 'equals',
      value: 'INVALID_LEVEL'
    };
    
    expect(() => validatePolicyCondition(condition)).toThrow();
  });

  it('should reject invalid action type', () => {
    const action = {
      id: randomUUID(),
      type: 'invalid_action'
    };
    
    expect(() => validatePolicyAction(action)).toThrow();
  });

  it('should reject policy without rules', () => {
    const policy = {
      id: randomUUID(),
      name: 'Empty Policy',
      organizationId: 'org_test',
      createdBy: 'did:atp:creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [] // Empty rules array should be rejected
    };
    
    expect(() => validateATPPolicy(policy)).toThrow();
  });

  it('should reject invalid UUID', () => {
    const condition = {
      id: 'not-a-uuid',
      type: 'trust_level',
      operator: 'equals',
      value: 'BASIC'
    };
    
    expect(() => validatePolicyCondition(condition)).toThrow();
  });
});
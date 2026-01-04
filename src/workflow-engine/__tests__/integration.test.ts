import { WorkflowEngine } from '../core/WorkflowEngine';
import { NodeRegistry } from '../core/NodeRegistry';
import { policyNodeDefinitions } from '../nodes/atp/PolicyNodes';
import { trustNodeDefinitions } from '../nodes/atp/TrustNodes';
import { monitoringNodeDefinitions } from '../nodes/atp/MonitoringNodes';

describe('Workflow Engine Integration Tests', () => {
  let engine: WorkflowEngine;
  let nodeRegistry: NodeRegistry;

  beforeEach(() => {
    nodeRegistry = new NodeRegistry();
    
    // Register all ATP nodes
    [...policyNodeDefinitions, ...trustNodeDefinitions, ...monitoringNodeDefinitions].forEach(def => {
      nodeRegistry.registerNode(def);
    });
    
    engine = new WorkflowEngine(nodeRegistry);
  });

  describe('Policy Workflow Integration', () => {
    it('should execute policy change workflow end-to-end', async () => {
      const policyWorkflow = {
        id: 'policy-change-workflow',
        name: 'Policy Change Handler',
        version: '1.0.0',
        nodes: [
          {
            id: 'policy-trigger',
            type: 'policy-change-trigger',
            label: 'Policy Change Detected',
            isStartNode: true,
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            id: 'validate-policy',
            type: 'policy-valid',
            label: 'Validate Policy',
            config: { policyId: 'test-policy-123' },
            position: { x: 300, y: 100 }
          },
          {
            id: 'deploy-policy',
            type: 'deploy-policy',
            label: 'Deploy Policy',
            config: { 
              policyId: 'test-policy-123',
              environment: 'production'
            },
            position: { x: 500, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'policy-trigger',
            targetNodeId: 'validate-policy'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'validate-policy',
            targetNodeId: 'deploy-policy'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(policyWorkflow);
      
      const result = await engine.executeWorkflow('policy-change-workflow', {
        policyId: 'test-policy-123',
        changeType: 'update',
        version: '1.1.0'
      });

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle policy validation failure', async () => {
      const failureWorkflow = {
        id: 'policy-validation-failure',
        name: 'Policy Validation Failure Test',
        version: '1.0.0',
        nodes: [
          {
            id: 'trigger',
            type: 'policy-change-trigger',
            label: 'Policy Trigger',
            isStartNode: true,
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            id: 'validate',
            type: 'policy-valid',
            label: 'Validate Policy',
            config: { policyId: 'invalid-policy' },
            position: { x: 300, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'trigger',
            targetNodeId: 'validate'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(failureWorkflow);
      
      const result = await engine.executeWorkflow('policy-validation-failure', {
        policyId: 'invalid-policy'
      });

      expect(result.success).toBe(true); // Workflow completes even if validation fails
      expect(result.data).toBeDefined();
    });
  });

  describe('Trust Workflow Integration', () => {
    it('should execute trust evaluation workflow', async () => {
      const trustWorkflow = {
        id: 'trust-evaluation-workflow',
        name: 'Trust Evaluation Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'trust-trigger',
            type: 'trust-change-trigger',
            label: 'Trust Change Detected',
            isStartNode: true,
            config: { threshold: 0.1 },
            position: { x: 100, y: 100 }
          },
          {
            id: 'evaluate-trust',
            type: 'evaluate-trust',
            label: 'Evaluate Trust',
            config: { agentDid: 'did:atp:test-agent' },
            position: { x: 300, y: 100 }
          },
          {
            id: 'check-threshold',
            type: 'trust-threshold',
            label: 'Check Threshold',
            config: { 
              agentDid: 'did:atp:test-agent',
              threshold: 0.7,
              operator: 'gte'
            },
            position: { x: 500, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'trust-trigger',
            targetNodeId: 'evaluate-trust'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'evaluate-trust',
            targetNodeId: 'check-threshold'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(trustWorkflow);
      
      const result = await engine.executeWorkflow('trust-evaluation-workflow', {
        agentDid: 'did:atp:test-agent',
        trustLevel: 0.65
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should execute risk assessment workflow', async () => {
      const riskWorkflow = {
        id: 'risk-assessment-workflow',
        name: 'Risk Assessment Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'risk-trigger',
            type: 'risk-detected-trigger',
            label: 'Risk Detected',
            isStartNode: true,
            config: { riskLevel: 'medium' },
            position: { x: 100, y: 100 }
          },
          {
            id: 'assess-risk',
            type: 'risk-assessment',
            label: 'Assess Risk',
            config: { maxAcceptableRisk: 0.5 },
            position: { x: 300, y: 100 }
          },
          {
            id: 'adjust-trust',
            type: 'adjust-trust',
            label: 'Adjust Trust',
            config: { 
              agentDid: 'did:atp:test-agent',
              adjustment: -0.1,
              adjustmentType: 'relative',
              reason: 'Risk detected'
            },
            position: { x: 500, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'risk-trigger',
            targetNodeId: 'assess-risk'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'assess-risk',
            targetNodeId: 'adjust-trust'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(riskWorkflow);
      
      const result = await engine.executeWorkflow('risk-assessment-workflow', {
        riskType: 'security',
        riskLevel: 'high'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Monitoring Workflow Integration', () => {
    it('should execute security monitoring workflow', async () => {
      const securityWorkflow = {
        id: 'security-monitoring-workflow',
        name: 'Security Monitoring Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'security-trigger',
            type: 'security-alert-trigger',
            label: 'Security Alert',
            isStartNode: true,
            config: { severityLevel: 'medium' },
            position: { x: 100, y: 100 }
          },
          {
            id: 'generate-report',
            type: 'generate-report',
            label: 'Generate Security Report',
            config: { 
              reportType: 'security',
              format: 'json'
            },
            position: { x: 300, y: 100 }
          },
          {
            id: 'send-alert',
            type: 'send-alert',
            label: 'Send Alert',
            config: { 
              severity: 'high',
              channels: ['email', 'slack'],
              title: 'Security Incident Report'
            },
            position: { x: 500, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'security-trigger',
            targetNodeId: 'generate-report'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'generate-report',
            targetNodeId: 'send-alert'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(securityWorkflow);
      
      const result = await engine.executeWorkflow('security-monitoring-workflow', {
        alertType: 'intrusion',
        severity: 'high'
      });

      expect(result.success).toBe(true);
    });

    it('should execute compliance monitoring workflow', async () => {
      const complianceWorkflow = {
        id: 'compliance-monitoring-workflow',
        name: 'Compliance Monitoring Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'compliance-check',
            type: 'compliance-status',
            label: 'Check Compliance',
            isStartNode: true,
            config: { 
              complianceType: 'general',
              requiredScore: 0.9
            },
            position: { x: 100, y: 100 }
          },
          {
            id: 'performance-check',
            type: 'performance-metrics',
            label: 'Check Performance',
            config: { 
              metricType: 'response_time',
              threshold: 500,
              aggregation: 'average'
            },
            position: { x: 300, y: 100 }
          },
          {
            id: 'generate-compliance-report',
            type: 'generate-report',
            label: 'Generate Compliance Report',
            config: { 
              reportType: 'compliance',
              format: 'pdf'
            },
            position: { x: 500, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'compliance-check',
            targetNodeId: 'performance-check'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'performance-check',
            targetNodeId: 'generate-compliance-report'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(complianceWorkflow);
      
      const result = await engine.executeWorkflow('compliance-monitoring-workflow', {
        checkType: 'scheduled'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Complex Workflow Integration', () => {
    it('should execute workflow with conditional branching', async () => {
      const conditionalWorkflow = {
        id: 'conditional-workflow',
        name: 'Conditional Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'start',
            type: 'trust-change-trigger',
            label: 'Start',
            isStartNode: true,
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            id: 'check-trust',
            type: 'trust-threshold',
            label: 'Check Trust Level',
            config: { 
              agentDid: 'did:atp:test-agent',
              threshold: 0.5,
              operator: 'gte'
            },
            position: { x: 300, y: 100 }
          },
          {
            id: 'high-trust-action',
            type: 'evaluate-trust',
            label: 'High Trust Action',
            config: { agentDid: 'did:atp:test-agent' },
            position: { x: 500, y: 50 }
          },
          {
            id: 'low-trust-action',
            type: 'adjust-trust',
            label: 'Low Trust Action',
            config: { 
              agentDid: 'did:atp:test-agent',
              adjustment: 0.1,
              adjustmentType: 'relative'
            },
            position: { x: 500, y: 150 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'start',
            targetNodeId: 'check-trust'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'check-trust',
            targetNodeId: 'high-trust-action',
            condition: (data: any) => data.meetsThreshold === true
          },
          {
            id: 'edge-3',
            sourceNodeId: 'check-trust',
            targetNodeId: 'low-trust-action',
            condition: (data: any) => data.meetsThreshold === false
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(conditionalWorkflow);
      
      const result = await engine.executeWorkflow('conditional-workflow', {
        agentDid: 'did:atp:test-agent',
        trustLevel: 0.3 // Low trust to trigger low-trust path
      });

      expect(result.success).toBe(true);
    });

    it('should execute workflow with multiple ATP node types', async () => {
      const complexWorkflow = {
        id: 'complex-atp-workflow',
        name: 'Complex ATP Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'policy-trigger',
            type: 'policy-violation-trigger',
            label: 'Policy Violation',
            isStartNode: true,
            config: { severityThreshold: 'medium' },
            position: { x: 100, y: 100 }
          },
          {
            id: 'evaluate-agent-trust',
            type: 'evaluate-trust',
            label: 'Evaluate Agent Trust',
            config: {},
            position: { x: 300, y: 100 }
          },
          {
            id: 'check-risk',
            type: 'risk-assessment',
            label: 'Assess Risk',
            config: { maxAcceptableRisk: 0.6 },
            position: { x: 500, y: 100 }
          },
          {
            id: 'update-policy',
            type: 'update-policy',
            label: 'Update Policy',
            config: {},
            position: { x: 700, y: 50 }
          },
          {
            id: 'send-notification',
            type: 'send-alert',
            label: 'Send Notification',
            config: { 
              severity: 'high',
              channels: ['email']
            },
            position: { x: 700, y: 150 }
          },
          {
            id: 'generate-incident-report',
            type: 'generate-report',
            label: 'Generate Incident Report',
            config: { 
              reportType: 'security',
              format: 'json'
            },
            position: { x: 900, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'policy-trigger',
            targetNodeId: 'evaluate-agent-trust'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'evaluate-agent-trust',
            targetNodeId: 'check-risk'
          },
          {
            id: 'edge-3',
            sourceNodeId: 'check-risk',
            targetNodeId: 'update-policy',
            condition: (data: any) => !data.isAcceptable
          },
          {
            id: 'edge-4',
            sourceNodeId: 'check-risk',
            targetNodeId: 'send-notification'
          },
          {
            id: 'edge-5',
            sourceNodeId: 'send-notification',
            targetNodeId: 'generate-incident-report'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(complexWorkflow);
      
      const result = await engine.executeWorkflow('complex-atp-workflow', {
        policyId: 'policy-123',
        agentDid: 'did:atp:violating-agent',
        violationType: 'trust_threshold',
        severity: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle node execution failures gracefully', async () => {
      // Create a workflow that will fail at a specific node
      const errorWorkflow = {
        id: 'error-handling-workflow',
        name: 'Error Handling Test',
        version: '1.0.0',
        nodes: [
          {
            id: 'start',
            type: 'policy-change-trigger',
            label: 'Start',
            isStartNode: true,
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            id: 'failing-node',
            type: 'create-policy',
            label: 'Create Policy (Will Fail)',
            config: { /* missing required name */ },
            position: { x: 300, y: 100 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'start',
            targetNodeId: 'failing-node'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(errorWorkflow);
      
      await expect(engine.executeWorkflow('error-handling-workflow')).rejects.toThrow();
    });

    it('should validate workflows before execution', async () => {
      const invalidWorkflow = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'unknown-node-type',
            label: 'Unknown Node',
            isStartNode: true,
            config: {},
            position: { x: 100, y: 100 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(invalidWorkflow)).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large workflows efficiently', async () => {
      // Create a workflow with many nodes
      const nodes = [];
      const edges = [];
      
      // Create a chain of 50 nodes
      for (let i = 0; i < 50; i++) {
        nodes.push({
          id: `node-${i}`,
          type: 'evaluate-trust',
          label: `Node ${i}`,
          isStartNode: i === 0,
          config: { agentDid: `did:atp:agent-${i}` },
          position: { x: i * 100, y: 100 }
        });
        
        if (i > 0) {
          edges.push({
            id: `edge-${i}`,
            sourceNodeId: `node-${i - 1}`,
            targetNodeId: `node-${i}`
          });
        }
      }

      const largeWorkflow = {
        id: 'large-workflow',
        name: 'Large Workflow Test',
        version: '1.0.0',
        nodes,
        edges,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const startTime = Date.now();
      
      await engine.registerWorkflow(largeWorkflow);
      const result = await engine.executeWorkflow('large-workflow');
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
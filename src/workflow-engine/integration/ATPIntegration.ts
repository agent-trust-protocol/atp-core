import { EventEmitter } from 'events';
import { WorkflowEventService } from '../services/WorkflowEventService';
import { WorkflowScheduler } from '../services/WorkflowScheduler';
import { workflowRepository } from '../database/repository';

interface ATPPolicy {
  id: string;
  name: string;
  version: string;
  rules: any[];
  actions: any[];
  status: 'draft' | 'active' | 'archived';
  metadata?: any;
}

interface ATPAgent {
  did: string;
  name?: string;
  trustLevel: number;
  status: 'active' | 'inactive' | 'suspended';
  lastActivity?: Date;
  metadata?: any;
}

interface ATPTrustMetrics {
  agentDid: string;
  trustLevel: number;
  factors: {
    authentication: number;
    behavior: number;
    compliance: number;
    history: number;
  };
  riskScore: number;
  lastEvaluated: Date;
}

export class ATPIntegration extends EventEmitter {
  private eventService: WorkflowEventService;
  private scheduler: WorkflowScheduler;
  private isInitialized = false;

  constructor(eventService: WorkflowEventService, scheduler: WorkflowScheduler) {
    super();
    this.eventService = eventService;
    this.scheduler = scheduler;
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('ATP Integration already initialized');
      return;
    }

    try {
      console.log('Initializing ATP integration...');
      
      // Set up ATP-specific workflow mappings
      await this.setupPolicyWorkflows();
      await this.setupTrustWorkflows();
      await this.setupMonitoringWorkflows();
      
      // Set up event listeners for ATP events
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('ATP integration initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize ATP integration:', error);
      throw error;
    }
  }

  private async setupPolicyWorkflows() {
    console.log('Setting up policy workflow mappings...');
    
    // Policy change detection workflow
    const policyChangeWorkflowId = await workflowRepository.createWorkflow({
      name: 'Policy Change Handler',
      description: 'Handles policy creation, updates, and deletions',
      nodes: [
        {
          id: 'policy-change-trigger',
          type: 'policy-change-trigger',
          label: 'Policy Change Detected',
          config: {},
          position: { x: 100, y: 100 }
        },
        {
          id: 'validate-policy',
          type: 'policy-valid',
          label: 'Validate Policy',
          config: {},
          position: { x: 300, y: 100 }
        },
        {
          id: 'deploy-policy',
          type: 'deploy-policy',
          label: 'Deploy to Agents',
          config: { environment: 'production' },
          position: { x: 500, y: 100 }
        },
        {
          id: 'audit-log',
          type: 'log',
          label: 'Log Policy Change',
          config: { level: 'info' },
          position: { x: 700, y: 100 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'policy-change-trigger',
          targetNodeId: 'validate-policy'
        },
        {
          id: 'edge-2',
          sourceNodeId: 'validate-policy',
          targetNodeId: 'deploy-policy'
        },
        {
          id: 'edge-3',
          sourceNodeId: 'deploy-policy',
          targetNodeId: 'audit-log'
        }
      ],
      triggers: [
        {
          id: 'policy-change',
          type: 'event',
          config: { eventName: 'atp.policy.policy-updated' },
          enabled: true
        }
      ]
    });

    // Create policy-workflow mapping
    await workflowRepository.createPolicyWorkflowMapping({
      policyId: '*', // All policies
      workflowId: policyChangeWorkflowId,
      triggerEvent: 'policy_updated',
      priority: 1
    });

    console.log(`Created policy change workflow: ${policyChangeWorkflowId}`);
  }

  private async setupTrustWorkflows() {
    console.log('Setting up trust workflow mappings...');
    
    // Trust evaluation workflow
    const trustEvaluationWorkflowId = await workflowRepository.createWorkflow({
      name: 'Trust Level Monitoring',
      description: 'Monitors and responds to trust level changes',
      nodes: [
        {
          id: 'trust-change-trigger',
          type: 'trust-change-trigger',
          label: 'Trust Change Detected',
          config: { threshold: 0.1 },
          position: { x: 100, y: 100 }
        },
        {
          id: 'check-threshold',
          type: 'trust-threshold',
          label: 'Check Trust Threshold',
          config: { threshold: 0.5, operator: 'lt' },
          position: { x: 300, y: 100 }
        },
        {
          id: 'risk-assessment',
          type: 'risk-assessment',
          label: 'Assess Risk',
          config: { maxAcceptableRisk: 0.7 },
          position: { x: 500, y: 100 }
        },
        {
          id: 'send-alert',
          type: 'send-alert',
          label: 'Send Security Alert',
          config: { 
            severity: 'high',
            channels: ['email', 'slack']
          },
          position: { x: 700, y: 100 }
        },
        {
          id: 'adjust-trust',
          type: 'adjust-trust',
          label: 'Adjust Trust Level',
          config: { adjustmentType: 'relative' },
          position: { x: 500, y: 300 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'trust-change-trigger',
          targetNodeId: 'check-threshold'
        },
        {
          id: 'edge-2',
          sourceNodeId: 'check-threshold',
          targetNodeId: 'risk-assessment',
          condition: { expression: 'meetsThreshold === false' }
        },
        {
          id: 'edge-3',
          sourceNodeId: 'risk-assessment',
          targetNodeId: 'send-alert',
          condition: { expression: 'isAcceptable === false' }
        },
        {
          id: 'edge-4',
          sourceNodeId: 'risk-assessment',
          targetNodeId: 'adjust-trust',
          condition: { expression: 'overallRisk > 0.8' }
        }
      ],
      triggers: [
        {
          id: 'trust-change',
          type: 'event',
          config: { eventName: 'atp.trust.trust-changed' },
          enabled: true
        }
      ]
    });

    // Create trust-workflow mapping
    await workflowRepository.createTrustWorkflowMapping({
      workflowId: trustEvaluationWorkflowId,
      triggerEvent: 'trust_changed',
      thresholds: {
        lowTrust: 0.3,
        highRisk: 0.8,
        criticalAlert: 0.9
      }
    });

    console.log(`Created trust evaluation workflow: ${trustEvaluationWorkflowId}`);
  }

  private async setupMonitoringWorkflows() {
    console.log('Setting up monitoring workflow mappings...');
    
    // Security monitoring workflow
    const securityMonitoringWorkflowId = await workflowRepository.createWorkflow({
      name: 'Security Incident Response',
      description: 'Responds to security alerts and incidents',
      nodes: [
        {
          id: 'security-alert-trigger',
          type: 'security-alert-trigger',
          label: 'Security Alert',
          config: { severityLevel: 'medium' },
          position: { x: 100, y: 100 }
        },
        {
          id: 'evaluate-severity',
          type: 'condition',
          label: 'Check Severity',
          config: { expression: 'alert.severity === "high" || alert.severity === "critical"' },
          position: { x: 300, y: 100 }
        },
        {
          id: 'immediate-response',
          type: 'send-alert',
          label: 'Immediate Alert',
          config: { 
            severity: 'critical',
            channels: ['email', 'sms', 'slack'],
            title: 'Critical Security Incident'
          },
          position: { x: 500, y: 50 }
        },
        {
          id: 'generate-report',
          type: 'generate-report',
          label: 'Generate Security Report',
          config: { reportType: 'security' },
          position: { x: 500, y: 200 }
        },
        {
          id: 'update-policies',
          type: 'update-policy',
          label: 'Update Security Policies',
          config: {},
          position: { x: 700, y: 100 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'security-alert-trigger',
          targetNodeId: 'evaluate-severity'
        },
        {
          id: 'edge-2',
          sourceNodeId: 'evaluate-severity',
          targetNodeId: 'immediate-response',
          sourceHandle: 'true'
        },
        {
          id: 'edge-3',
          sourceNodeId: 'evaluate-severity',
          targetNodeId: 'generate-report',
          sourceHandle: 'false'
        },
        {
          id: 'edge-4',
          sourceNodeId: 'immediate-response',
          targetNodeId: 'update-policies'
        },
        {
          id: 'edge-5',
          sourceNodeId: 'generate-report',
          targetNodeId: 'update-policies'
        }
      ],
      triggers: [
        {
          id: 'security-alert',
          type: 'event',
          config: { eventName: 'atp.security.security-alert' },
          enabled: true
        }
      ]
    });

    console.log(`Created security monitoring workflow: ${securityMonitoringWorkflowId}`);

    // Compliance monitoring workflow
    const complianceWorkflowId = await workflowRepository.createWorkflow({
      name: 'Compliance Monitoring',
      description: 'Regular compliance checks and reporting',
      nodes: [
        {
          id: 'schedule-trigger',
          type: 'schedule',
          label: 'Daily Compliance Check',
          config: { schedule: '0 9 * * *' },
          position: { x: 100, y: 100 }
        },
        {
          id: 'compliance-check',
          type: 'compliance-status',
          label: 'Check Compliance',
          config: { requiredScore: 0.9 },
          position: { x: 300, y: 100 }
        },
        {
          id: 'generate-report',
          type: 'generate-report',
          label: 'Generate Compliance Report',
          config: { reportType: 'compliance' },
          position: { x: 500, y: 100 }
        },
        {
          id: 'check-violations',
          type: 'condition',
          label: 'Check for Violations',
          config: { expression: 'isCompliant === false' },
          position: { x: 700, y: 100 }
        },
        {
          id: 'send-violation-alert',
          type: 'send-alert',
          label: 'Send Violation Alert',
          config: { 
            severity: 'high',
            title: 'Compliance Violation Detected'
          },
          position: { x: 900, y: 100 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'schedule-trigger',
          targetNodeId: 'compliance-check'
        },
        {
          id: 'edge-2',
          sourceNodeId: 'compliance-check',
          targetNodeId: 'generate-report'
        },
        {
          id: 'edge-3',
          sourceNodeId: 'generate-report',
          targetNodeId: 'check-violations'
        },
        {
          id: 'edge-4',
          sourceNodeId: 'check-violations',
          targetNodeId: 'send-violation-alert',
          sourceHandle: 'true'
        }
      ],
      triggers: [
        {
          id: 'daily-schedule',
          type: 'schedule',
          config: { schedule: '0 9 * * *' },
          enabled: true
        }
      ]
    });

    // Schedule the compliance workflow
    await this.scheduler.scheduleWorkflow(complianceWorkflowId, '0 9 * * *', true);

    console.log(`Created compliance monitoring workflow: ${complianceWorkflowId}`);
  }

  private setupEventListeners() {
    console.log('Setting up ATP event listeners...');
    
    // Listen for workflow execution events
    this.eventService.on('workflow:executed', (data) => {
      console.log(`Workflow executed: ${data.workflowId} - ${data.result.success ? 'SUCCESS' : 'FAILED'}`);
      this.emit('workflow:completed', data);
    });

    this.eventService.on('workflow:execution-failed', (data) => {
      console.log(`Workflow failed: ${data.workflowId} - ${data.error}`);
      this.emit('workflow:failed', data);
    });
  }

  // ATP Policy Integration Methods
  async handlePolicyChange(policy: ATPPolicy, changeType: 'created' | 'updated' | 'deleted') {
    console.log(`Processing policy ${changeType}: ${policy.id}`);
    
    await this.eventService.publishPolicyEvent(`policy-${changeType}`, {
      policyId: policy.id,
      policyName: policy.name,
      version: policy.version,
      changeType,
      timestamp: new Date(),
      policy: policy
    });
  }

  async handlePolicyViolation(violation: {
    policyId: string;
    agentDid: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
  }) {
    console.log(`Processing policy violation: ${violation.policyId} by ${violation.agentDid}`);
    
    await this.eventService.publishPolicyEvent('policy-violated', violation);
  }

  // ATP Trust Integration Methods
  async handleTrustLevelChange(trustMetrics: ATPTrustMetrics) {
    console.log(`Processing trust change for agent: ${trustMetrics.agentDid}`);
    
    await this.eventService.publishTrustEvent('trust-changed', {
      agentDid: trustMetrics.agentDid,
      trustLevel: trustMetrics.trustLevel,
      factors: trustMetrics.factors,
      riskScore: trustMetrics.riskScore,
      timestamp: new Date()
    });
  }

  async handleRiskDetection(risk: {
    agentDid?: string;
    riskType: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    recommendedActions: string[];
  }) {
    console.log(`Processing risk detection: ${risk.riskType} - ${risk.riskLevel}`);
    
    await this.eventService.publishTrustEvent('risk-detected', risk);
  }

  // ATP Security Integration Methods
  async handleSecurityAlert(alert: {
    alertId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: any;
    affectedResources: any[];
    indicators: string[];
    recommendedActions: string[];
  }) {
    console.log(`Processing security alert: ${alert.alertId} - ${alert.severity}`);
    
    await this.eventService.publishSecurityEvent('security-alert', alert);
  }

  // ATP Agent Integration Methods
  async onAgentRegistration(agent: ATPAgent) {
    console.log(`Agent registered: ${agent.did}`);
    
    // Create initial trust evaluation workflow for new agent
    await this.createAgentTrustWorkflow(agent.did);
    
    this.emit('agent:registered', agent);
  }

  async onAgentStatusChange(agentDid: string, newStatus: string, oldStatus: string) {
    console.log(`Agent status changed: ${agentDid} - ${oldStatus} -> ${newStatus}`);
    
    await this.eventService.publishEvent({
      type: 'atp.agent.status-changed',
      data: { agentDid, newStatus, oldStatus, timestamp: new Date() },
      source: 'atp-agent-service'
    });
  }

  private async createAgentTrustWorkflow(agentDid: string) {
    const workflowId = await workflowRepository.createWorkflow({
      name: `Trust Monitoring - ${agentDid}`,
      description: `Continuous trust monitoring for agent ${agentDid}`,
      nodes: [
        {
          id: 'evaluate-trust',
          type: 'evaluate-trust',
          label: 'Evaluate Trust',
          config: { agentDid },
          position: { x: 100, y: 100 }
        },
        {
          id: 'check-threshold',
          type: 'trust-threshold',
          label: 'Check Threshold',
          config: { agentDid, threshold: 0.7 },
          position: { x: 300, y: 100 }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'evaluate-trust',
          targetNodeId: 'check-threshold'
        }
      ],
      triggers: [
        {
          id: 'hourly-check',
          type: 'schedule',
          config: { schedule: '0 * * * *' },
          enabled: true
        }
      ]
    });

    // Schedule the agent trust workflow
    await this.scheduler.scheduleWorkflow(workflowId, '0 * * * *', true);

    return workflowId;
  }

  // Utility methods for ATP integration
  async getWorkflowsForPolicy(policyId: string) {
    // This would query the policy_workflows table
    // For now, return empty array as placeholder
    return [];
  }

  async getWorkflowsForAgent(agentDid: string) {
    // This would query the trust_workflows table
    // For now, return empty array as placeholder
    return [];
  }

  async triggerWorkflowForEvent(eventType: string, eventData: any) {
    await this.eventService.publishEvent({
      type: eventType,
      data: eventData,
      source: 'atp-integration'
    });
  }

  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      eventService: this.eventService.getStatistics(),
      scheduler: this.scheduler.getStatistics()
    };
  }

  async shutdown() {
    console.log('Shutting down ATP integration...');
    
    this.isInitialized = false;
    this.emit('shutdown');
    
    console.log('ATP integration shutdown complete');
  }
}
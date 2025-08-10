/**
 * ATP Agent Handoff Protocol
 * Seamless coordination between Claude Code and BMAD-METHOD agents
 */

export interface AgentMessage {
  from: AgentIdentifier;
  to: AgentIdentifier;
  type: MessageType;
  payload: TaskPayload;
  metadata: MessageMetadata;
}

export type AgentIdentifier = 
  | 'claude-code:master'
  | 'claude-code:build'
  | 'claude-code:ui'
  | 'claude-code:api'
  | 'claude-code:security'
  | 'claude-code:integration'
  | 'bmad:master'
  | 'bmad:orchestrator'
  | 'bmad:analyst'
  | 'bmad:architect'
  | 'bmad:pm'
  | 'bmad:po'
  | 'bmad:dev'
  | 'bmad:qa'
  | 'bmad:sm'
  | 'bmad:ux-expert';

export type MessageType = 
  | 'task_assignment'
  | 'status_update'
  | 'result_delivery'
  | 'error_report'
  | 'coordination_request'
  | 'capability_query';

export interface TaskPayload {
  task_id: string;
  task_type: TaskType;
  priority: Priority;
  content: TaskContent;
  dependencies?: string[];
  acceptance_criteria: string[];
  deadline?: Date;
}

export type TaskType = 
  | 'build_fix'
  | 'ui_development'
  | 'api_implementation'
  | 'security_audit'
  | 'integration_test'
  | 'documentation'
  | 'deployment';

export type Priority = 'critical' | 'high' | 'normal' | 'low';

export interface TaskContent {
  description: string;
  requirements: string[];
  technical_specs?: TechnicalSpecs;
  resources?: Resource[];
  context?: Record<string, any>;
}

export interface TechnicalSpecs {
  language?: string;
  framework?: string;
  dependencies?: string[];
  constraints?: string[];
  performance_targets?: PerformanceTargets;
}

export interface PerformanceTargets {
  response_time_ms?: number;
  memory_limit_mb?: number;
  cpu_usage_percent?: number;
  throughput_rps?: number;
}

export interface Resource {
  type: 'file' | 'api' | 'database' | 'service';
  identifier: string;
  access_level: 'read' | 'write' | 'admin';
}

export interface MessageMetadata {
  timestamp: Date;
  correlation_id: string;
  session_id: string;
  retry_count?: number;
  ttl_seconds?: number;
}

/**
 * Handoff Decision Engine
 * Determines which agent should handle a specific task
 */
export class HandoffDecisionEngine {
  private agentCapabilities = new Map<AgentIdentifier, Set<string>>();

  constructor() {
    this.initializeCapabilities();
  }

  private initializeCapabilities(): void {
    // Claude Code agents
    this.agentCapabilities.set('claude-code:build', new Set([
      'docker', 'ci_cd', 'build_optimization', 'dependency_management'
    ]));
    
    this.agentCapabilities.set('claude-code:ui', new Set([
      'react', 'nextjs', 'shadcn_ui', 'tailwind', 'responsive_design'
    ]));
    
    this.agentCapabilities.set('claude-code:api', new Set([
      'express', 'postgresql', 'rest_api', 'graphql', 'microservices'
    ]));
    
    this.agentCapabilities.set('claude-code:security', new Set([
      'cryptography', 'pqc', 'did', 'audit_logging', 'security_scanning'
    ]));
    
    this.agentCapabilities.set('claude-code:integration', new Set([
      'e2e_testing', 'sdk_validation', 'mcp_protocol', 'workflow_automation'
    ]));

    // BMAD-METHOD agents
    this.agentCapabilities.set('bmad:dev', new Set([
      'coding', 'implementation', 'debugging', 'refactoring'
    ]));
    
    this.agentCapabilities.set('bmad:qa', new Set([
      'testing', 'quality_assurance', 'test_automation', 'bug_tracking'
    ]));
    
    this.agentCapabilities.set('bmad:architect', new Set([
      'system_design', 'architecture', 'technical_planning', 'scalability'
    ]));
    
    this.agentCapabilities.set('bmad:ux-expert', new Set([
      'ui_design', 'user_experience', 'accessibility', 'usability_testing'
    ]));
  }

  /**
   * Determine the best agent for a given task
   */
  public selectAgent(task: TaskPayload): AgentIdentifier {
    const taskKeywords = this.extractKeywords(task);
    let bestMatch: { agent: AgentIdentifier; score: number } = {
      agent: 'claude-code:master',
      score: 0
    };

    for (const [agent, capabilities] of this.agentCapabilities.entries()) {
      const score = this.calculateMatchScore(taskKeywords, capabilities);
      if (score > bestMatch.score) {
        bestMatch = { agent, score };
      }
    }

    return bestMatch.agent;
  }

  private extractKeywords(task: TaskPayload): Set<string> {
    const keywords = new Set<string>();
    
    // Extract from task type
    keywords.add(task.task_type);
    
    // Extract from description
    const descWords = task.content.description.toLowerCase().split(/\s+/);
    descWords.forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
    
    // Extract from technical specs
    if (task.content.technical_specs) {
      const specs = task.content.technical_specs;
      if (specs.language) keywords.add(specs.language.toLowerCase());
      if (specs.framework) keywords.add(specs.framework.toLowerCase());
      specs.dependencies?.forEach(dep => keywords.add(dep.toLowerCase()));
    }
    
    return keywords;
  }

  private calculateMatchScore(keywords: Set<string>, capabilities: Set<string>): number {
    let score = 0;
    for (const keyword of keywords) {
      for (const capability of capabilities) {
        if (capability.includes(keyword) || keyword.includes(capability)) {
          score += 1;
        }
      }
    }
    return score;
  }
}

/**
 * Message Router
 * Routes messages between Claude Code and BMAD-METHOD agents
 */
export class MessageRouter {
  private messageQueue: AgentMessage[] = [];
  private handlers = new Map<AgentIdentifier, MessageHandler>();

  /**
   * Register a message handler for an agent
   */
  public registerHandler(agent: AgentIdentifier, handler: MessageHandler): void {
    this.handlers.set(agent, handler);
  }

  /**
   * Send a message to an agent
   */
  public async sendMessage(message: AgentMessage): Promise<void> {
    // Log the message for audit
    await this.logMessage(message);
    
    // Get the handler for the target agent
    const handler = this.handlers.get(message.to);
    
    if (handler) {
      await handler.handle(message);
    } else {
      // Queue the message if no handler is available
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  public async processQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      const handler = this.handlers.get(message.to);
      
      if (handler) {
        await handler.handle(message);
      } else {
        // Re-queue if still no handler
        this.messageQueue.push(message);
        break;
      }
    }
  }

  private async logMessage(message: AgentMessage): Promise<void> {
    // Log to audit trail
    console.log(`[${new Date().toISOString()}] Message: ${message.from} -> ${message.to}`, {
      type: message.type,
      task_id: message.payload.task_id,
      priority: message.payload.priority
    });
  }
}

/**
 * Message Handler Interface
 */
export interface MessageHandler {
  handle(message: AgentMessage): Promise<void>;
}

/**
 * Task Coordinator
 * Coordinates tasks between multiple agents
 */
export class TaskCoordinator {
  private decisionEngine: HandoffDecisionEngine;
  private messageRouter: MessageRouter;
  private activeTasks = new Map<string, TaskStatus>();

  constructor() {
    this.decisionEngine = new HandoffDecisionEngine();
    this.messageRouter = new MessageRouter();
  }

  /**
   * Submit a new task for processing
   */
  public async submitTask(task: TaskPayload): Promise<string> {
    // Select the best agent for the task
    const selectedAgent = this.decisionEngine.selectAgent(task);
    
    // Create the message
    const message: AgentMessage = {
      from: 'claude-code:master',
      to: selectedAgent,
      type: 'task_assignment',
      payload: task,
      metadata: {
        timestamp: new Date(),
        correlation_id: this.generateCorrelationId(),
        session_id: this.generateSessionId()
      }
    };
    
    // Track the task
    this.activeTasks.set(task.task_id, {
      status: 'assigned',
      assigned_to: selectedAgent,
      started_at: new Date()
    });
    
    // Send the message
    await this.messageRouter.sendMessage(message);
    
    return task.task_id;
  }

  /**
   * Update task status
   */
  public updateTaskStatus(task_id: string, status: TaskStatusType): void {
    const task = this.activeTasks.get(task_id);
    if (task) {
      task.status = status;
      if (status === 'completed' || status === 'failed') {
        task.completed_at = new Date();
      }
    }
  }

  /**
   * Get task status
   */
  public getTaskStatus(task_id: string): TaskStatus | undefined {
    return this.activeTasks.get(task_id);
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface TaskStatus {
  status: TaskStatusType;
  assigned_to: AgentIdentifier;
  started_at: Date;
  completed_at?: Date;
  error?: string;
}

export type TaskStatusType = 
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed';

/**
 * Example Usage
 */
export function createExampleTask(): TaskPayload {
  return {
    task_id: 'ATP-2025-001',
    task_type: 'build_fix',
    priority: 'critical',
    content: {
      description: 'Fix production build failure due to PostCSS configuration',
      requirements: [
        'Ensure autoprefixer is available in production',
        'Update package.json dependencies',
        'Verify Docker build includes necessary packages',
        'Test build in CI/CD pipeline'
      ],
      technical_specs: {
        language: 'typescript',
        framework: 'nextjs',
        dependencies: ['postcss', 'autoprefixer', 'tailwindcss'],
        constraints: ['Must maintain existing functionality', 'Zero downtime deployment']
      }
    },
    acceptance_criteria: [
      'npm run build succeeds without errors',
      'Docker build completes successfully',
      'CI/CD pipeline passes all checks',
      'Production deployment successful'
    ]
  };
}

// Export for use in other modules
export default {
  HandoffDecisionEngine,
  MessageRouter,
  TaskCoordinator,
  createExampleTask
};
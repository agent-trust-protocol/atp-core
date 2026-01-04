export enum WorkflowState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event' | 'condition';
  config: {
    schedule?: string;
    webhookUrl?: string;
    eventName?: string;
    condition?: any;
    [key: string]: any;
  };
  enabled: boolean;
}

export interface NodeInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  default?: any;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
    custom?: (value: any) => boolean;
  };
}

export interface NodeOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description?: string;
}

export interface NodeConfig {
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  properties?: Record<string, any>;
  validation?: (config: any) => boolean;
  [key: string]: any;
}

export interface NodeData {
  id: string;
  type: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  config: NodeConfig;
  position?: {
    x: number;
    y: number;
  };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    [key: string]: any;
  };
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  config?: Record<string, any>;
  position?: {
    x: number;
    y: number;
  };
  isStartNode?: boolean;
  isEndNode?: boolean;
  metadata?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: any;
  label?: string;
  type?: 'default' | 'conditional' | 'error';
  metadata?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers?: WorkflowTrigger[];
  variables?: Record<string, any>;
  settings?: {
    maxExecutionTime?: number;
    retryPolicy?: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier?: number;
    };
    errorHandling?: 'stop' | 'continue' | 'retry';
    notifications?: {
      onStart?: boolean;
      onComplete?: boolean;
      onError?: boolean;
      channels?: string[];
    };
  };
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    tags?: string[];
    category?: string;
    [key: string]: any;
  };
}

export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  state: WorkflowState;
  currentNodeId: string | null;
  data: Record<string, any>;
  errors: Array<{
    nodeId: string;
    message: string;
    timestamp: Date;
    details?: any;
  }>;
  completedNodes: string[];
  variables?: Record<string, any>;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionId: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface NodeExecutor {
  type: string;
  execute: (
    inputs: any, 
    config: NodeConfig, 
    context: WorkflowExecutionContext
  ) => Promise<any>;
  validate?: (config: NodeConfig) => boolean;
  getSchema?: () => {
    inputs: NodeInput[];
    outputs: NodeOutput[];
    config?: Record<string, any>;
  };
}

export interface WorkflowEvent {
  type: 'workflow:started' | 'workflow:completed' | 'workflow:failed' | 
        'workflow:paused' | 'workflow:resumed' | 'workflow:cancelled' |
        'node:executing' | 'node:completed' | 'node:failed';
  timestamp: Date;
  executionId: string;
  workflowId?: string;
  nodeId?: string;
  data?: any;
  error?: any;
}

export interface WorkflowRepository {
  save(workflow: Workflow): Promise<void>;
  load(workflowId: string): Promise<Workflow>;
  delete(workflowId: string): Promise<void>;
  list(): Promise<Workflow[]>;
  search(query: string): Promise<Workflow[]>;
}

export interface WorkflowHistory {
  executionId: string;
  workflowId: string;
  workflowVersion: string;
  startTime: Date;
  endTime?: Date;
  state: WorkflowState;
  result?: ExecutionResult;
  events: WorkflowEvent[];
  nodeExecutions: Array<{
    nodeId: string;
    startTime: Date;
    endTime?: Date;
    status: NodeStatus;
    inputs?: any;
    outputs?: any;
    error?: any;
  }>;
}

export interface WorkflowStatistics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutionTime?: Date;
  nodeStatistics: Map<string, {
    executions: number;
    failures: number;
    averageDuration: number;
  }>;
}

export type NodeCategory = 
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'transform'
  | 'integration'
  | 'utility'
  | 'output';

export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  config?: Record<string, any>;
  executor: NodeExecutor;
}
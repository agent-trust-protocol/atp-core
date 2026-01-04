import { EventEmitter } from 'events';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowState, 
  WorkflowExecutionContext,
  ExecutionResult,
  WorkflowValidationResult,
  WorkflowTrigger
} from '../types/WorkflowTypes';
import { NodeRegistry } from './NodeRegistry';

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecutionContext> = new Map();
  private nodeRegistry: NodeRegistry;

  constructor(nodeRegistry: NodeRegistry) {
    super();
    this.nodeRegistry = nodeRegistry;
  }

  async registerWorkflow(workflow: Workflow): Promise<void> {
    const validation = await this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }
    
    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:registered', workflow);
  }

  async executeWorkflow(
    workflowId: string, 
    initialData?: any, 
    context?: Partial<WorkflowExecutionContext>
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const executionContext: WorkflowExecutionContext = {
      executionId,
      workflowId,
      startTime: new Date(),
      state: WorkflowState.RUNNING,
      currentNodeId: null,
      data: initialData || {},
      errors: [],
      completedNodes: [],
      ...context
    };

    this.activeExecutions.set(executionId, executionContext);
    this.emit('workflow:started', executionContext);

    try {
      const result = await this.runWorkflow(workflow, executionContext);
      executionContext.state = WorkflowState.COMPLETED;
      executionContext.endTime = new Date();
      this.emit('workflow:completed', executionContext);
      return result;
    } catch (error) {
      executionContext.state = WorkflowState.FAILED;
      executionContext.endTime = new Date();
      executionContext.errors.push({
        nodeId: executionContext.currentNodeId || 'unknown',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      this.emit('workflow:failed', executionContext);
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private async runWorkflow(
    workflow: Workflow, 
    context: WorkflowExecutionContext
  ): Promise<ExecutionResult> {
    const startNode = this.findStartNode(workflow);
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    const visited = new Set<string>();
    const queue: WorkflowNode[] = [startNode];
    const results: Map<string, any> = new Map();

    while (queue.length > 0) {
      const node = queue.shift()!;
      
      if (visited.has(node.id)) {
        continue;
      }
      
      visited.add(node.id);
      context.currentNodeId = node.id;
      
      this.emit('node:executing', { node, context });
      
      try {
        const nodeHandler = this.nodeRegistry.getNode(node.type);
        const inputs = this.gatherNodeInputs(node, results, context);
        const output = await nodeHandler.execute(inputs, node.config, context);
        
        results.set(node.id, output);
        context.completedNodes.push(node.id);
        
        this.emit('node:completed', { node, output, context });
        
        const nextNodes = this.getNextNodes(workflow, node, output);
        queue.push(...nextNodes);
      } catch (error) {
        this.emit('node:failed', { node, error, context });
        throw error;
      }
    }

    return {
      success: true,
      data: results.get(visited.values().next().value),
      executionId: context.executionId,
      duration: context.endTime ? 
        context.endTime.getTime() - context.startTime.getTime() : 0
    };
  }

  private async validateWorkflow(workflow: Workflow): Promise<WorkflowValidationResult> {
    const errors: string[] = [];
    
    if (!workflow.id || !workflow.name) {
      errors.push('Workflow must have an id and name');
    }
    
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    const startNodes = workflow.nodes.filter(n => n.isStartNode);
    
    if (startNodes.length === 0) {
      errors.push('Workflow must have at least one start node');
    }
    
    if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node');
    }
    
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
        errors.push(`Edge references non-existent node: ${edge.sourceNodeId} -> ${edge.targetNodeId}`);
      }
    }
    
    for (const node of workflow.nodes) {
      if (!this.nodeRegistry.hasNode(node.type)) {
        errors.push(`Unknown node type: ${node.type}`);
      }
    }
    
    const hasCycles = this.detectCycles(workflow);
    if (hasCycles) {
      errors.push('Workflow contains cycles');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private detectCycles(workflow: Workflow): boolean {
    const adjacencyList = new Map<string, string[]>();
    
    for (const node of workflow.nodes) {
      adjacencyList.set(node.id, []);
    }
    
    for (const edge of workflow.edges) {
      adjacencyList.get(edge.sourceNodeId)?.push(edge.targetNodeId);
    }
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of adjacencyList.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private findStartNode(workflow: Workflow): WorkflowNode | null {
    return workflow.nodes.find(n => n.isStartNode) || null;
  }

  private getNextNodes(
    workflow: Workflow, 
    currentNode: WorkflowNode, 
    output: any
  ): WorkflowNode[] {
    const edges = workflow.edges.filter(e => e.sourceNodeId === currentNode.id);
    const nextNodeIds = edges
      .filter(edge => this.evaluateCondition(edge.condition, output))
      .map(edge => edge.targetNodeId);
    
    return workflow.nodes.filter(n => nextNodeIds.includes(n.id));
  }

  private evaluateCondition(condition: any, data: any): boolean {
    if (!condition) return true;
    
    if (typeof condition === 'function') {
      return condition(data);
    }
    
    if (typeof condition === 'object' && condition.expression) {
      try {
        return new Function('data', `return ${condition.expression}`)(data);
      } catch {
        return false;
      }
    }
    
    return true;
  }

  private gatherNodeInputs(
    node: WorkflowNode, 
    results: Map<string, any>, 
    context: WorkflowExecutionContext
  ): any {
    const inputs: any = {};
    
    if (node.inputs) {
      for (const [key, inputConfig] of Object.entries(node.inputs)) {
        if (typeof inputConfig === 'string') {
          if (inputConfig.startsWith('$')) {
            const nodeId = inputConfig.substring(1);
            inputs[key] = results.get(nodeId);
          } else if (inputConfig.startsWith('context.')) {
            const path = inputConfig.substring(8);
            inputs[key] = this.getValueByPath(context.data, path);
          } else {
            inputs[key] = inputConfig;
          }
        } else {
          inputs[key] = inputConfig;
        }
      }
    }
    
    return inputs;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  pauseExecution(executionId: string): void {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      context.state = WorkflowState.PAUSED;
      this.emit('workflow:paused', context);
    }
  }

  resumeExecution(executionId: string): void {
    const context = this.activeExecutions.get(executionId);
    if (context && context.state === WorkflowState.PAUSED) {
      context.state = WorkflowState.RUNNING;
      this.emit('workflow:resumed', context);
    }
  }

  cancelExecution(executionId: string): void {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      context.state = WorkflowState.CANCELLED;
      context.endTime = new Date();
      this.activeExecutions.delete(executionId);
      this.emit('workflow:cancelled', context);
    }
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getActiveExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecutionContext(executionId: string): WorkflowExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }
}
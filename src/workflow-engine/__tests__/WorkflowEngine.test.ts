import { WorkflowEngine } from '../core/WorkflowEngine';
import { NodeRegistry } from '../core/NodeRegistry';
import { WorkflowState, NodeDefinition, NodeExecutor } from '../types/WorkflowTypes';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let nodeRegistry: NodeRegistry;

  // Mock node executor for testing
  const mockNodeExecutor: NodeExecutor = {
    type: 'test-node',
    async execute(inputs: any, config: any, context: any) {
      return { success: true, data: inputs };
    },
    validate: (config: any) => true,
    getSchema: () => ({
      inputs: [{ name: 'input1', type: 'string', required: true }],
      outputs: [{ name: 'output1', type: 'string' }]
    })
  };

  const mockNodeDefinition: NodeDefinition = {
    type: 'test-node',
    category: 'action',
    label: 'Test Node',
    description: 'A test node for unit testing',
    inputs: [{ name: 'input1', type: 'string', required: true }],
    outputs: [{ name: 'output1', type: 'string' }],
    executor: mockNodeExecutor
  };

  beforeEach(() => {
    nodeRegistry = new NodeRegistry();
    nodeRegistry.registerNode(mockNodeDefinition);
    engine = new WorkflowEngine(nodeRegistry);
  });

  describe('Workflow Registration', () => {
    it('should register a valid workflow', async () => {
      const workflow = {
        id: 'test-workflow-1',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'test-node',
            label: 'Test Node 1',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(workflow)).resolves.not.toThrow();
      expect(engine.getWorkflow('test-workflow-1')).toBeDefined();
    });

    it('should reject workflow without start node', async () => {
      const workflow = {
        id: 'test-workflow-2',
        name: 'Invalid Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'test-node',
            label: 'Test Node 1',
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(workflow)).rejects.toThrow('start node');
    });

    it('should reject workflow with unknown node type', async () => {
      const workflow = {
        id: 'test-workflow-3',
        name: 'Invalid Node Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'unknown-node',
            label: 'Unknown Node',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(workflow)).rejects.toThrow('Unknown node type');
    });
  });

  describe('Workflow Execution', () => {
    beforeEach(async () => {
      const workflow = {
        id: 'test-execution-workflow',
        name: 'Test Execution Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'start-node',
            type: 'test-node',
            label: 'Start Node',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          },
          {
            id: 'end-node',
            type: 'test-node',
            label: 'End Node',
            config: {},
            position: { x: 200, y: 0 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'start-node',
            targetNodeId: 'end-node'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(workflow);
    });

    it('should execute a simple workflow successfully', async () => {
      const result = await engine.executeWorkflow('test-execution-workflow', { test: 'data' });

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track execution context during workflow execution', async () => {
      const executionPromise = engine.executeWorkflow('test-execution-workflow', { test: 'data' });
      
      // Check that execution is tracked
      const activeExecutions = engine.getActiveExecutions();
      expect(activeExecutions.length).toBeGreaterThan(0);

      const result = await executionPromise;
      expect(result.success).toBe(true);

      // Check that execution is cleaned up
      const activeExecutionsAfter = engine.getActiveExecutions();
      expect(activeExecutionsAfter.length).toBe(0);
    });

    it('should handle workflow execution with initial data', async () => {
      const initialData = { message: 'Hello, World!' };
      const result = await engine.executeWorkflow('test-execution-workflow', initialData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Execution Control', () => {
    it('should cancel workflow execution', async () => {
      // Create a workflow with a slow node
      const slowNodeExecutor: NodeExecutor = {
        type: 'slow-node',
        async execute() {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true };
        }
      };

      const slowNodeDefinition: NodeDefinition = {
        type: 'slow-node',
        category: 'action',
        label: 'Slow Node',
        description: 'A slow node for testing cancellation',
        inputs: [],
        outputs: [],
        executor: slowNodeExecutor
      };

      nodeRegistry.registerNode(slowNodeDefinition);

      const workflow = {
        id: 'slow-workflow',
        name: 'Slow Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'slow-start',
            type: 'slow-node',
            label: 'Slow Start',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(workflow);

      // Start execution
      const executionPromise = engine.executeWorkflow('slow-workflow');
      
      // Get execution ID
      const activeExecutions = engine.getActiveExecutions();
      expect(activeExecutions.length).toBe(1);
      const executionId = activeExecutions[0].executionId;

      // Cancel execution
      engine.cancelExecution(executionId);

      // Verify execution is cancelled
      await expect(executionPromise).rejects.toThrow();
      
      const context = engine.getExecutionContext(executionId);
      expect(context).toBeUndefined();
    });
  });

  describe('Workflow Validation', () => {
    it('should detect cycles in workflow', async () => {
      const cyclicWorkflow = {
        id: 'cyclic-workflow',
        name: 'Cyclic Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-a',
            type: 'test-node',
            label: 'Node A',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          },
          {
            id: 'node-b',
            type: 'test-node',
            label: 'Node B',
            config: {},
            position: { x: 200, y: 0 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'node-a',
            targetNodeId: 'node-b'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'node-b',
            targetNodeId: 'node-a'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(cyclicWorkflow)).rejects.toThrow('cycles');
    });

    it('should validate edge references', async () => {
      const invalidWorkflow = {
        id: 'invalid-edge-workflow',
        name: 'Invalid Edge Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'test-node',
            label: 'Node 1',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'node-1',
            targetNodeId: 'non-existent-node'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(engine.registerWorkflow(invalidWorkflow)).rejects.toThrow('non-existent node');
    });
  });

  describe('Event Handling', () => {
    it('should emit workflow events', async () => {
      const events: string[] = [];
      
      engine.on('workflow:started', () => events.push('started'));
      engine.on('workflow:completed', () => events.push('completed'));
      engine.on('node:executing', () => events.push('node-executing'));
      engine.on('node:completed', () => events.push('node-completed'));

      const workflow = {
        id: 'event-test-workflow',
        name: 'Event Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'test-node',
            type: 'test-node',
            label: 'Test Node',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(workflow);
      await engine.executeWorkflow('event-test-workflow');

      expect(events).toContain('started');
      expect(events).toContain('completed');
      expect(events).toContain('node-executing');
      expect(events).toContain('node-completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle node execution errors', async () => {
      const errorNodeExecutor: NodeExecutor = {
        type: 'error-node',
        async execute() {
          throw new Error('Test error');
        }
      };

      const errorNodeDefinition: NodeDefinition = {
        type: 'error-node',
        category: 'action',
        label: 'Error Node',
        description: 'A node that throws an error',
        inputs: [],
        outputs: [],
        executor: errorNodeExecutor
      };

      nodeRegistry.registerNode(errorNodeDefinition);

      const errorWorkflow = {
        id: 'error-workflow',
        name: 'Error Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'error-start',
            type: 'error-node',
            label: 'Error Start',
            isStartNode: true,
            config: {},
            position: { x: 0, y: 0 }
          }
        ],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await engine.registerWorkflow(errorWorkflow);

      await expect(engine.executeWorkflow('error-workflow')).rejects.toThrow('Test error');
    });
  });
});
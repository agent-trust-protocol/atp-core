import { NodeRegistry } from '../core/NodeRegistry';
import { NodeDefinition, NodeExecutor } from '../types/WorkflowTypes';

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  describe('Node Registration', () => {
    it('should register a valid node', () => {
      const mockExecutor: NodeExecutor = {
        type: 'test-node',
        async execute() {
          return { success: true };
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'test-node',
        category: 'action',
        label: 'Test Node',
        description: 'A test node',
        inputs: [],
        outputs: [],
        executor: mockExecutor
      };

      expect(() => registry.registerNode(nodeDefinition)).not.toThrow();
      expect(registry.hasNode('test-node')).toBe(true);
    });

    it('should reject duplicate node registration', () => {
      const mockExecutor: NodeExecutor = {
        type: 'duplicate-node',
        async execute() {
          return { success: true };
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'duplicate-node',
        category: 'action',
        label: 'Duplicate Node',
        description: 'A duplicate node',
        inputs: [],
        outputs: [],
        executor: mockExecutor
      };

      registry.registerNode(nodeDefinition);
      expect(() => registry.registerNode(nodeDefinition)).toThrow('already registered');
    });

    it('should reject invalid node definition', () => {
      const invalidNode = {
        type: '',
        category: 'action',
        label: '',
        description: '',
        inputs: [],
        outputs: [],
        executor: null
      } as any;

      expect(() => registry.registerNode(invalidNode)).toThrow('Invalid node definition');
    });

    it('should register multiple nodes in bulk', () => {
      const mockExecutor1: NodeExecutor = {
        type: 'bulk-node-1',
        async execute() {
          return { success: true };
        }
      };

      const mockExecutor2: NodeExecutor = {
        type: 'bulk-node-2',
        async execute() {
          return { success: true };
        }
      };

      const nodes: NodeDefinition[] = [
        {
          type: 'bulk-node-1',
          category: 'action',
          label: 'Bulk Node 1',
          description: 'First bulk node',
          inputs: [],
          outputs: [],
          executor: mockExecutor1
        },
        {
          type: 'bulk-node-2',
          category: 'trigger',
          label: 'Bulk Node 2',
          description: 'Second bulk node',
          inputs: [],
          outputs: [],
          executor: mockExecutor2
        }
      ];

      expect(() => registry.registerBulkNodes(nodes)).not.toThrow();
      expect(registry.hasNode('bulk-node-1')).toBe(true);
      expect(registry.hasNode('bulk-node-2')).toBe(true);
    });
  });

  describe('Node Retrieval', () => {
    beforeEach(() => {
      const mockExecutors = ['action-node', 'trigger-node', 'condition-node'].map(type => ({
        type,
        async execute() {
          return { success: true };
        }
      }));

      const nodeDefinitions: NodeDefinition[] = [
        {
          type: 'action-node',
          category: 'action',
          label: 'Action Node',
          description: 'An action node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[0]
        },
        {
          type: 'trigger-node',
          category: 'trigger',
          label: 'Trigger Node',
          description: 'A trigger node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[1]
        },
        {
          type: 'condition-node',
          category: 'condition',
          label: 'Condition Node',
          description: 'A condition node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[2]
        }
      ];

      registry.registerBulkNodes(nodeDefinitions);
    });

    it('should retrieve registered node executor', () => {
      const executor = registry.getNode('action-node');
      expect(executor).toBeDefined();
      expect(executor.type).toBe('action-node');
    });

    it('should throw error for unregistered node', () => {
      expect(() => registry.getNode('non-existent-node')).toThrow('not registered');
    });

    it('should get node definition', () => {
      const definition = registry.getNodeDefinition('action-node');
      expect(definition).toBeDefined();
      expect(definition?.type).toBe('action-node');
      expect(definition?.category).toBe('action');
    });

    it('should get nodes by category', () => {
      const actionNodes = registry.getNodesByCategory('action');
      expect(actionNodes).toHaveLength(1);
      expect(actionNodes[0].type).toBe('action-node');

      const triggerNodes = registry.getNodesByCategory('trigger');
      expect(triggerNodes).toHaveLength(1);
      expect(triggerNodes[0].type).toBe('trigger-node');
    });

    it('should get all nodes', () => {
      const allNodes = registry.getAllNodes();
      expect(allNodes).toHaveLength(3);
      
      const nodeTypes = allNodes.map(n => n.type);
      expect(nodeTypes).toContain('action-node');
      expect(nodeTypes).toContain('trigger-node');
      expect(nodeTypes).toContain('condition-node');
    });

    it('should get all categories with nodes', () => {
      const categories = registry.getAllCategories();
      expect(categories).toHaveLength(8); // All 8 categories, some empty
      
      const actionCategory = categories.find(c => c.category === 'action');
      expect(actionCategory?.nodes).toHaveLength(1);
      
      const triggerCategory = categories.find(c => c.category === 'trigger');
      expect(triggerCategory?.nodes).toHaveLength(1);
    });
  });

  describe('Node Search and Filtering', () => {
    beforeEach(() => {
      const nodeDefinitions: NodeDefinition[] = [
        {
          type: 'email-sender',
          category: 'action',
          label: 'Email Sender',
          description: 'Sends email notifications',
          inputs: [],
          outputs: [],
          executor: { type: 'email-sender', async execute() { return { success: true }; } }
        },
        {
          type: 'file-processor',
          category: 'transform',
          label: 'File Processor',
          description: 'Processes files and documents',
          inputs: [],
          outputs: [],
          executor: { type: 'file-processor', async execute() { return { success: true }; } }
        },
        {
          type: 'webhook-trigger',
          category: 'trigger',
          label: 'Webhook Trigger',
          description: 'Triggers workflow via webhook',
          inputs: [],
          outputs: [],
          executor: { type: 'webhook-trigger', async execute() { return { success: true }; } }
        }
      ];

      registry.registerBulkNodes(nodeDefinitions);
    });

    it('should search nodes by name', () => {
      const results = registry.searchNodes('email');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('email-sender');
    });

    it('should search nodes by description', () => {
      const results = registry.searchNodes('webhook');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('webhook-trigger');
    });

    it('should search nodes by category', () => {
      const results = registry.searchNodes('action');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('email-sender');
    });

    it('should return empty array for no matches', () => {
      const results = registry.searchNodes('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results = registry.searchNodes('EMAIL');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('email-sender');
    });
  });

  describe('Node Validation', () => {
    beforeEach(() => {
      const validatorExecutor: NodeExecutor = {
        type: 'validator-node',
        async execute() {
          return { success: true };
        },
        validate: (config) => {
          return config && config.required === true;
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'validator-node',
        category: 'utility',
        label: 'Validator Node',
        description: 'A node with validation',
        inputs: [],
        outputs: [],
        executor: validatorExecutor
      };

      registry.registerNode(nodeDefinition);
    });

    it('should validate node config when validator exists', () => {
      const validConfig = { required: true };
      expect(registry.validateNodeConfig('validator-node', validConfig)).toBe(true);

      const invalidConfig = { required: false };
      expect(registry.validateNodeConfig('validator-node', invalidConfig)).toBe(false);
    });

    it('should return true for nodes without validators', () => {
      expect(registry.validateNodeConfig('non-validator-node', {})).toBe(true);
    });
  });

  describe('Node Schema', () => {
    beforeEach(() => {
      const schemaExecutor: NodeExecutor = {
        type: 'schema-node',
        async execute() {
          return { success: true };
        },
        getSchema: () => ({
          inputs: [
            { name: 'message', type: 'string', required: true }
          ],
          outputs: [
            { name: 'result', type: 'boolean' }
          ],
          config: { timeout: 30000 }
        })
      };

      const nodeDefinition: NodeDefinition = {
        type: 'schema-node',
        category: 'utility',
        label: 'Schema Node',
        description: 'A node with schema',
        inputs: [{ name: 'message', type: 'string', required: true }],
        outputs: [{ name: 'result', type: 'boolean' }],
        executor: schemaExecutor
      };

      registry.registerNode(nodeDefinition);
    });

    it('should get node schema from executor', () => {
      const schema = registry.getNodeSchema('schema-node');
      expect(schema).toBeDefined();
      expect(schema?.inputs).toHaveLength(1);
      expect(schema?.outputs).toHaveLength(1);
      expect(schema?.config).toEqual({ timeout: 30000 });
    });

    it('should fall back to definition schema', () => {
      const fallbackExecutor: NodeExecutor = {
        type: 'fallback-node',
        async execute() {
          return { success: true };
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'fallback-node',
        category: 'utility',
        label: 'Fallback Node',
        description: 'A node without getSchema',
        inputs: [{ name: 'input1', type: 'string', required: false }],
        outputs: [{ name: 'output1', type: 'number' }],
        config: { mode: 'test' },
        executor: fallbackExecutor
      };

      registry.registerNode(nodeDefinition);

      const schema = registry.getNodeSchema('fallback-node');
      expect(schema).toBeDefined();
      expect(schema?.inputs).toHaveLength(1);
      expect(schema?.outputs).toHaveLength(1);
      expect(schema?.config).toEqual({ mode: 'test' });
    });

    it('should return null for non-existent node', () => {
      const schema = registry.getNodeSchema('non-existent');
      expect(schema).toBeNull();
    });
  });

  describe('Registry Management', () => {
    it('should unregister node', () => {
      const mockExecutor: NodeExecutor = {
        type: 'temp-node',
        async execute() {
          return { success: true };
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'temp-node',
        category: 'utility',
        label: 'Temporary Node',
        description: 'A temporary node',
        inputs: [],
        outputs: [],
        executor: mockExecutor
      };

      registry.registerNode(nodeDefinition);
      expect(registry.hasNode('temp-node')).toBe(true);

      registry.unregisterNode('temp-node');
      expect(registry.hasNode('temp-node')).toBe(false);
    });

    it('should throw error when unregistering non-existent node', () => {
      expect(() => registry.unregisterNode('non-existent')).toThrow('not registered');
    });

    it('should clear registry', () => {
      const mockExecutor: NodeExecutor = {
        type: 'clear-test-node',
        async execute() {
          return { success: true };
        }
      };

      const nodeDefinition: NodeDefinition = {
        type: 'clear-test-node',
        category: 'utility',
        label: 'Clear Test Node',
        description: 'A node for testing clear',
        inputs: [],
        outputs: [],
        executor: mockExecutor
      };

      registry.registerNode(nodeDefinition);
      expect(registry.getAllNodes()).toHaveLength(1);

      registry.clearRegistry();
      expect(registry.getAllNodes()).toHaveLength(0);
    });

    it('should get registry statistics', () => {
      const mockExecutors = ['stat-1', 'stat-2', 'stat-3'].map(type => ({
        type,
        async execute() {
          return { success: true };
        },
        validate: () => true
      }));

      const nodeDefinitions: NodeDefinition[] = [
        {
          type: 'stat-1',
          category: 'action',
          label: 'Stat Node 1',
          description: 'First stat node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[0]
        },
        {
          type: 'stat-2',
          category: 'action',
          label: 'Stat Node 2',
          description: 'Second stat node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[1]
        },
        {
          type: 'stat-3',
          category: 'trigger',
          label: 'Stat Node 3',
          description: 'Third stat node',
          inputs: [],
          outputs: [],
          executor: mockExecutors[2]
        }
      ];

      registry.registerBulkNodes(nodeDefinitions);

      const stats = registry.getStatistics();
      expect(stats.totalNodes).toBe(3);
      expect(stats.nodesByCategory.action).toBe(2);
      expect(stats.nodesByCategory.trigger).toBe(1);
      expect(stats.nodesWithValidators).toBe(3);
    });
  });
});
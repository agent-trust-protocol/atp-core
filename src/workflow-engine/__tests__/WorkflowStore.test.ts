import { useWorkflowStore } from '../store/WorkflowStore';
import { WorkflowState } from '../types/WorkflowTypes';

// Disable the persist middleware so the store is pure in-memory for tests
// (no storage dependency). The store imports immer from
// 'zustand/middleware/immer', which is intentionally left intact.
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn
}));

// The Zustand store is exercised directly via getState(): every action calls
// set() synchronously (real immer), so getState() reflects the new state
// immediately. This avoids React rendering entirely — no renderHook/act and
// no jsdom environment are required.
const store = () => useWorkflowStore.getState();

describe('WorkflowStore', () => {
  beforeEach(() => {
    // Fully reset the singleton store before each test so executions/UI state
    // from a previous test cannot leak (e.g. a lingering active execution would
    // keep isExecuting true).
    useWorkflowStore.setState({
      workflows: {},
      activeExecutions: {},
      executionHistory: [],
      workflowStatistics: {},
      selectedWorkflow: null,
      selectedNode: null,
      isExecuting: false,
      errors: []
    });
  });

  describe('Workflow Management', () => {
    it('should create a workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [],
        edges: []
      });

      expect(workflowId).toBeDefined();
      expect(store().workflows[workflowId]).toBeDefined();
      expect(store().workflows[workflowId].name).toBe('Test Workflow');
    });

    it('should update a workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Original Name',
        description: 'Original description'
      });

      store().updateWorkflow(workflowId, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(store().workflows[workflowId].name).toBe('Updated Name');
      expect(store().workflows[workflowId].description).toBe('Updated description');
    });

    it('should delete a workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'To Delete',
        description: 'Will be deleted'
      });

      expect(store().workflows[workflowId]).toBeDefined();

      store().deleteWorkflow(workflowId);

      expect(store().workflows[workflowId]).toBeUndefined();
    });

    it('should duplicate a workflow', () => {
      const originalId = store().createWorkflow({
        name: 'Original Workflow',
        description: 'Original description',
        nodes: [{ id: 'node1', type: 'test', label: 'Test Node', position: { x: 0, y: 0 } }],
        edges: []
      });

      const duplicateId = store().duplicateWorkflow(originalId);

      expect(duplicateId).toBeDefined();
      expect(duplicateId).not.toBe(originalId);
      expect(store().workflows[duplicateId].name).toBe('Original Workflow (Copy)');
      expect(store().workflows[duplicateId].nodes).toHaveLength(1);
    });
  });

  describe('Node Management', () => {
    it('should add a node to workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const node = {
        id: 'node-1',
        type: 'test-node',
        label: 'Test Node',
        position: { x: 100, y: 100 }
      };

      store().addNode(workflowId, node);

      expect(store().workflows[workflowId].nodes).toHaveLength(1);
      expect(store().workflows[workflowId].nodes[0]).toEqual(node);
    });

    it('should update a node in workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'test-node',
            label: 'Original Label',
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      });

      store().updateNode(workflowId, 'node-1', {
        label: 'Updated Label',
        position: { x: 200, y: 200 }
      });

      const updatedNode = store().workflows[workflowId].nodes[0];
      expect(updatedNode.label).toBe('Updated Label');
      expect(updatedNode.position).toEqual({ x: 200, y: 200 });
    });

    it('should remove a node from workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'test-node',
            label: 'Node 1',
            position: { x: 100, y: 100 }
          },
          {
            id: 'node-2',
            type: 'test-node',
            label: 'Node 2',
            position: { x: 200, y: 200 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2'
          }
        ]
      });

      store().removeNode(workflowId, 'node-1');

      expect(store().workflows[workflowId].nodes).toHaveLength(1);
      expect(store().workflows[workflowId].nodes[0].id).toBe('node-2');
      expect(store().workflows[workflowId].edges).toHaveLength(0);
    });
  });

  describe('Edge Management', () => {
    it('should add an edge to workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const edge = {
        id: 'edge-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2'
      };

      store().addEdge(workflowId, edge);

      expect(store().workflows[workflowId].edges).toHaveLength(1);
      expect(store().workflows[workflowId].edges[0]).toEqual(edge);
    });

    it('should update an edge in workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2'
          }
        ]
      });

      store().updateEdge(workflowId, 'edge-1', {
        label: 'Updated Edge',
        condition: { expression: 'true' }
      });

      const updatedEdge = store().workflows[workflowId].edges[0];
      expect(updatedEdge.label).toBe('Updated Edge');
      expect(updatedEdge.condition).toEqual({ expression: 'true' });
    });

    it('should remove an edge from workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: [
          {
            id: 'edge-1',
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2'
          },
          {
            id: 'edge-2',
            sourceNodeId: 'node-2',
            targetNodeId: 'node-3'
          }
        ]
      });

      store().removeEdge(workflowId, 'edge-1');

      expect(store().workflows[workflowId].edges).toHaveLength(1);
      expect(store().workflows[workflowId].edges[0].id).toBe('edge-2');
    });
  });

  describe('Execution Management', () => {
    it('should start workflow execution', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const executionId = store().startExecution(workflowId, { test: 'data' });

      expect(executionId).toBeDefined();
      expect(store().activeExecutions[executionId]).toBeDefined();
      expect(store().activeExecutions[executionId].workflowId).toBe(workflowId);
      expect(store().activeExecutions[executionId].state).toBe(WorkflowState.RUNNING);
      expect(store().isExecuting).toBe(true);
    });

    it('should update execution context', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const executionId = store().startExecution(workflowId);

      store().updateExecution(executionId, {
        currentNodeId: 'node-1',
        completedNodes: ['node-0']
      });

      const execution = store().activeExecutions[executionId];
      expect(execution.currentNodeId).toBe('node-1');
      expect(execution.completedNodes).toContain('node-0');
    });

    it('should complete execution', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const executionId = store().startExecution(workflowId);

      const executionResult = {
        success: true,
        data: { result: 'completed' },
        executionId,
        duration: 1000
      };

      store().completeExecution(executionId, executionResult);

      expect(store().activeExecutions[executionId]).toBeUndefined();
      expect(store().executionHistory).toHaveLength(1);
      expect(store().executionHistory[0].state).toBe(WorkflowState.COMPLETED);
      expect(store().isExecuting).toBe(false);
    });

    it('should cancel execution', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const executionId = store().startExecution(workflowId);

      store().cancelExecution(executionId);

      expect(store().activeExecutions[executionId]).toBeUndefined();
      expect(store().isExecuting).toBe(false);
    });
  });

  describe('Statistics Management', () => {
    it('should update workflow statistics', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      const executionResult = {
        success: true,
        data: {},
        executionId: 'exec-1',
        duration: 1500
      };

      store().updateStatistics(workflowId, executionResult);

      const stats = store().getStatistics(workflowId);
      expect(stats).toBeDefined();
      expect(stats!.totalExecutions).toBe(1);
      expect(stats!.successfulExecutions).toBe(1);
      expect(stats!.failedExecutions).toBe(0);
      expect(stats!.averageDuration).toBe(1500);
    });

    it('should update statistics for multiple executions', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      // First execution (success)
      store().updateStatistics(workflowId, {
        success: true,
        data: {},
        executionId: 'exec-1',
        duration: 1000
      });

      // Second execution (failure)
      store().updateStatistics(workflowId, {
        success: false,
        error: 'Test error',
        data: {},
        executionId: 'exec-2',
        duration: 2000
      });

      const stats = store().getStatistics(workflowId);
      expect(stats!.totalExecutions).toBe(2);
      expect(stats!.successfulExecutions).toBe(1);
      expect(stats!.failedExecutions).toBe(1);
      expect(stats!.averageDuration).toBe(1500); // (1000 + 2000) / 2
    });
  });

  describe('UI State Management', () => {
    it('should manage selected workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      store().setSelectedWorkflow(workflowId);
      expect(store().selectedWorkflow).toBe(workflowId);

      store().setSelectedWorkflow(null);
      expect(store().selectedWorkflow).toBeNull();
    });

    it('should manage selected node', () => {
      store().setSelectedNode('node-1');
      expect(store().selectedNode).toBe('node-1');

      store().setSelectedNode(null);
      expect(store().selectedNode).toBeNull();
    });

    it('should clear node selection when workflow changes', () => {
      const workflowId = store().createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      store().setSelectedNode('node-1');
      expect(store().selectedNode).toBe('node-1');

      store().setSelectedWorkflow(workflowId);
      expect(store().selectedNode).toBeNull();
    });

    it('should manage error state', () => {
      store().addError('Test error 1');
      store().addError('Test error 2');

      expect(store().errors).toHaveLength(2);
      expect(store().errors).toContain('Test error 1');
      expect(store().errors).toContain('Test error 2');

      store().clearErrors();
      expect(store().errors).toHaveLength(0);
    });
  });

  describe('Import/Export', () => {
    it('should export workflow', () => {
      const workflowId = store().createWorkflow({
        name: 'Export Test',
        description: 'Test workflow for export',
        nodes: [{ id: 'node1', type: 'test', label: 'Test Node', position: { x: 0, y: 0 } }],
        edges: []
      });

      const exported = store().exportWorkflow(workflowId);

      expect(exported).toBeDefined();
      expect(exported!.name).toBe('Export Test');
      expect(exported!.nodes).toHaveLength(1);
    });

    it('should import workflow', () => {
      const workflowToImport = {
        id: 'imported-workflow',
        name: 'Imported Workflow',
        description: 'An imported workflow',
        version: '1.0.0',
        nodes: [{ id: 'node1', type: 'test', label: 'Imported Node', position: { x: 0, y: 0 } }],
        edges: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const importedId = store().importWorkflow(workflowToImport);

      expect(importedId).toBe('imported-workflow');
      expect(store().workflows[importedId]).toBeDefined();
      expect(store().workflows[importedId].name).toBe('Imported Workflow');
    });

    it('should export all workflows', () => {
      store().createWorkflow({ name: 'Workflow 1', nodes: [], edges: [] });
      store().createWorkflow({ name: 'Workflow 2', nodes: [], edges: [] });

      const exported = store().exportAllWorkflows();

      expect(exported).toHaveLength(2);
      expect(exported.map(w => w.name)).toContain('Workflow 1');
      expect(exported.map(w => w.name)).toContain('Workflow 2');
    });

    it('should import multiple workflows', () => {
      const workflowsToImport = [
        {
          id: 'bulk-1',
          name: 'Bulk Import 1',
          version: '1.0.0',
          nodes: [],
          edges: [],
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        },
        {
          id: 'bulk-2',
          name: 'Bulk Import 2',
          version: '1.0.0',
          nodes: [],
          edges: [],
          metadata: { createdAt: new Date(), updatedAt: new Date() }
        }
      ];

      store().importWorkflows(workflowsToImport);

      expect(store().workflows['bulk-1']).toBeDefined();
      expect(store().workflows['bulk-2']).toBeDefined();
      expect(store().workflows['bulk-1'].name).toBe('Bulk Import 1');
      expect(store().workflows['bulk-2'].name).toBe('Bulk Import 2');
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useWorkflowStore } from '../store/WorkflowStore';
import { WorkflowState } from '../types/WorkflowTypes';

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
  immer: (fn: any) => fn
}));

describe('WorkflowStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    const { result } = renderHook(() => useWorkflowStore());
    act(() => {
      // Clear all workflows and reset state
      Object.keys(result.current.workflows).forEach(id => {
        result.current.deleteWorkflow(id);
      });
      result.current.clearErrors();
      result.current.clearHistory();
    });
  });

  describe('Workflow Management', () => {
    it('should create a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          description: 'A test workflow',
          nodes: [],
          edges: []
        });

        expect(workflowId).toBeDefined();
        expect(result.current.workflows[workflowId]).toBeDefined();
        expect(result.current.workflows[workflowId].name).toBe('Test Workflow');
      });
    });

    it('should update a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Original Name',
          description: 'Original description'
        });

        result.current.updateWorkflow(workflowId, {
          name: 'Updated Name',
          description: 'Updated description'
        });

        expect(result.current.workflows[workflowId].name).toBe('Updated Name');
        expect(result.current.workflows[workflowId].description).toBe('Updated description');
      });
    });

    it('should delete a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'To Delete',
          description: 'Will be deleted'
        });

        expect(result.current.workflows[workflowId]).toBeDefined();

        result.current.deleteWorkflow(workflowId);

        expect(result.current.workflows[workflowId]).toBeUndefined();
      });
    });

    it('should duplicate a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const originalId = result.current.createWorkflow({
          name: 'Original Workflow',
          description: 'Original description',
          nodes: [{ id: 'node1', type: 'test', label: 'Test Node', position: { x: 0, y: 0 } }],
          edges: []
        });

        const duplicateId = result.current.duplicateWorkflow(originalId);

        expect(duplicateId).toBeDefined();
        expect(duplicateId).not.toBe(originalId);
        expect(result.current.workflows[duplicateId].name).toBe('Original Workflow (Copy)');
        expect(result.current.workflows[duplicateId].nodes).toHaveLength(1);
      });
    });
  });

  describe('Node Management', () => {
    it('should add a node to workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.addNode(workflowId, node);

        expect(result.current.workflows[workflowId].nodes).toHaveLength(1);
        expect(result.current.workflows[workflowId].nodes[0]).toEqual(node);
      });
    });

    it('should update a node in workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.updateNode(workflowId, 'node-1', {
          label: 'Updated Label',
          position: { x: 200, y: 200 }
        });

        const updatedNode = result.current.workflows[workflowId].nodes[0];
        expect(updatedNode.label).toBe('Updated Label');
        expect(updatedNode.position).toEqual({ x: 200, y: 200 });
      });
    });

    it('should remove a node from workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.removeNode(workflowId, 'node-1');

        expect(result.current.workflows[workflowId].nodes).toHaveLength(1);
        expect(result.current.workflows[workflowId].nodes[0].id).toBe('node-2');
        expect(result.current.workflows[workflowId].edges).toHaveLength(0);
      });
    });
  });

  describe('Edge Management', () => {
    it('should add an edge to workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        const edge = {
          id: 'edge-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2'
        };

        result.current.addEdge(workflowId, edge);

        expect(result.current.workflows[workflowId].edges).toHaveLength(1);
        expect(result.current.workflows[workflowId].edges[0]).toEqual(edge);
      });
    });

    it('should update an edge in workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.updateEdge(workflowId, 'edge-1', {
          label: 'Updated Edge',
          condition: { expression: 'true' }
        });

        const updatedEdge = result.current.workflows[workflowId].edges[0];
        expect(updatedEdge.label).toBe('Updated Edge');
        expect(updatedEdge.condition).toEqual({ expression: 'true' });
      });
    });

    it('should remove an edge from workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.removeEdge(workflowId, 'edge-1');

        expect(result.current.workflows[workflowId].edges).toHaveLength(1);
        expect(result.current.workflows[workflowId].edges[0].id).toBe('edge-2');
      });
    });
  });

  describe('Execution Management', () => {
    it('should start workflow execution', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        const executionId = result.current.startExecution(workflowId, { test: 'data' });

        expect(executionId).toBeDefined();
        expect(result.current.activeExecutions[executionId]).toBeDefined();
        expect(result.current.activeExecutions[executionId].workflowId).toBe(workflowId);
        expect(result.current.activeExecutions[executionId].state).toBe(WorkflowState.RUNNING);
        expect(result.current.isExecuting).toBe(true);
      });
    });

    it('should update execution context', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        const executionId = result.current.startExecution(workflowId);

        result.current.updateExecution(executionId, {
          currentNodeId: 'node-1',
          completedNodes: ['node-0']
        });

        const execution = result.current.activeExecutions[executionId];
        expect(execution.currentNodeId).toBe('node-1');
        expect(execution.completedNodes).toContain('node-0');
      });
    });

    it('should complete execution', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        const executionId = result.current.startExecution(workflowId);

        const executionResult = {
          success: true,
          data: { result: 'completed' },
          executionId,
          duration: 1000
        };

        result.current.completeExecution(executionId, executionResult);

        expect(result.current.activeExecutions[executionId]).toBeUndefined();
        expect(result.current.executionHistory).toHaveLength(1);
        expect(result.current.executionHistory[0].state).toBe(WorkflowState.COMPLETED);
        expect(result.current.isExecuting).toBe(false);
      });
    });

    it('should cancel execution', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        const executionId = result.current.startExecution(workflowId);

        result.current.cancelExecution(executionId);

        expect(result.current.activeExecutions[executionId]).toBeUndefined();
        expect(result.current.isExecuting).toBe(false);
      });
    });
  });

  describe('Statistics Management', () => {
    it('should update workflow statistics', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
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

        result.current.updateStatistics(workflowId, executionResult);

        const stats = result.current.getStatistics(workflowId);
        expect(stats).toBeDefined();
        expect(stats!.totalExecutions).toBe(1);
        expect(stats!.successfulExecutions).toBe(1);
        expect(stats!.failedExecutions).toBe(0);
        expect(stats!.averageDuration).toBe(1500);
      });
    });

    it('should update statistics for multiple executions', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        // First execution (success)
        result.current.updateStatistics(workflowId, {
          success: true,
          data: {},
          executionId: 'exec-1',
          duration: 1000
        });

        // Second execution (failure)
        result.current.updateStatistics(workflowId, {
          success: false,
          error: 'Test error',
          data: {},
          executionId: 'exec-2',
          duration: 2000
        });

        const stats = result.current.getStatistics(workflowId);
        expect(stats!.totalExecutions).toBe(2);
        expect(stats!.successfulExecutions).toBe(1);
        expect(stats!.failedExecutions).toBe(1);
        expect(stats!.averageDuration).toBe(1500); // (1000 + 2000) / 2
      });
    });
  });

  describe('UI State Management', () => {
    it('should manage selected workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        result.current.setSelectedWorkflow(workflowId);
        expect(result.current.selectedWorkflow).toBe(workflowId);

        result.current.setSelectedWorkflow(null);
        expect(result.current.selectedWorkflow).toBeNull();
      });
    });

    it('should manage selected node', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setSelectedNode('node-1');
        expect(result.current.selectedNode).toBe('node-1');

        result.current.setSelectedNode(null);
        expect(result.current.selectedNode).toBeNull();
      });
    });

    it('should clear node selection when workflow changes', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Test Workflow',
          nodes: [],
          edges: []
        });

        result.current.setSelectedNode('node-1');
        expect(result.current.selectedNode).toBe('node-1');

        result.current.setSelectedWorkflow(workflowId);
        expect(result.current.selectedNode).toBeNull();
      });
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.addError('Test error 1');
        result.current.addError('Test error 2');

        expect(result.current.errors).toHaveLength(2);
        expect(result.current.errors).toContain('Test error 1');
        expect(result.current.errors).toContain('Test error 2');

        result.current.clearErrors();
        expect(result.current.errors).toHaveLength(0);
      });
    });
  });

  describe('Import/Export', () => {
    it('should export workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        const workflowId = result.current.createWorkflow({
          name: 'Export Test',
          description: 'Test workflow for export',
          nodes: [{ id: 'node1', type: 'test', label: 'Test Node', position: { x: 0, y: 0 } }],
          edges: []
        });

        const exported = result.current.exportWorkflow(workflowId);

        expect(exported).toBeDefined();
        expect(exported!.name).toBe('Export Test');
        expect(exported!.nodes).toHaveLength(1);
      });
    });

    it('should import workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

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

      act(() => {
        const importedId = result.current.importWorkflow(workflowToImport);

        expect(importedId).toBe('imported-workflow');
        expect(result.current.workflows[importedId]).toBeDefined();
        expect(result.current.workflows[importedId].name).toBe('Imported Workflow');
      });
    });

    it('should export all workflows', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.createWorkflow({ name: 'Workflow 1', nodes: [], edges: [] });
        result.current.createWorkflow({ name: 'Workflow 2', nodes: [], edges: [] });

        const exported = result.current.exportAllWorkflows();

        expect(exported).toHaveLength(2);
        expect(exported.map(w => w.name)).toContain('Workflow 1');
        expect(exported.map(w => w.name)).toContain('Workflow 2');
      });
    });

    it('should import multiple workflows', () => {
      const { result } = renderHook(() => useWorkflowStore());

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

      act(() => {
        result.current.importWorkflows(workflowsToImport);

        expect(result.current.workflows['bulk-1']).toBeDefined();
        expect(result.current.workflows['bulk-2']).toBeDefined();
        expect(result.current.workflows['bulk-1'].name).toBe('Bulk Import 1');
        expect(result.current.workflows['bulk-2'].name).toBe('Bulk Import 2');
      });
    });
  });
});
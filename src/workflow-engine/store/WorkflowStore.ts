import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowState, 
  WorkflowExecutionContext,
  ExecutionResult,
  WorkflowHistory,
  WorkflowStatistics,
  WorkflowVariable
} from '../types/WorkflowTypes';

interface WorkflowStoreState {
  workflows: Record<string, Workflow>;
  activeExecutions: Record<string, WorkflowExecutionContext>;
  executionHistory: WorkflowHistory[];
  workflowStatistics: Record<string, WorkflowStatistics>;
  selectedWorkflow: string | null;
  selectedNode: string | null;
  isExecuting: boolean;
  errors: string[];
  
  // Actions
  createWorkflow: (workflow: Partial<Workflow>) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => string;
  
  // Node operations
  addNode: (workflowId: string, node: WorkflowNode) => void;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (workflowId: string, nodeId: string) => void;
  
  // Edge operations
  addEdge: (workflowId: string, edge: WorkflowEdge) => void;
  updateEdge: (workflowId: string, edgeId: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (workflowId: string, edgeId: string) => void;
  
  // Execution
  startExecution: (workflowId: string, initialData?: any) => string;
  updateExecution: (executionId: string, updates: Partial<WorkflowExecutionContext>) => void;
  completeExecution: (executionId: string, result: ExecutionResult) => void;
  cancelExecution: (executionId: string) => void;
  
  // History
  addToHistory: (history: WorkflowHistory) => void;
  clearHistory: () => void;
  getExecutionHistory: (workflowId?: string) => WorkflowHistory[];
  
  // Statistics
  updateStatistics: (workflowId: string, executionResult: ExecutionResult) => void;
  getStatistics: (workflowId: string) => WorkflowStatistics | null;
  
  // UI State
  setSelectedWorkflow: (workflowId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setIsExecuting: (executing: boolean) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  
  // Export/Import
  exportWorkflow: (workflowId: string) => Workflow | null;
  importWorkflow: (workflow: Workflow) => string;
  exportAllWorkflows: () => Workflow[];
  importWorkflows: (workflows: Workflow[]) => void;
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  persist(
    immer((set, get) => ({
      workflows: {},
      activeExecutions: {},
      executionHistory: [],
      workflowStatistics: {},
      selectedWorkflow: null,
      selectedNode: null,
      isExecuting: false,
      errors: [],

      createWorkflow: (workflow) => {
        const id = uuidv4();
        const now = new Date();
        
        set((state) => {
          state.workflows[id] = {
            id,
            name: workflow.name || 'New Workflow',
            description: workflow.description || '',
            version: workflow.version || '1.0.0',
            nodes: workflow.nodes || [],
            edges: workflow.edges || [],
            triggers: workflow.triggers || [],
            variables: workflow.variables || {},
            settings: workflow.settings || {},
            metadata: {
              ...workflow.metadata,
              createdAt: now,
              updatedAt: now,
              createdBy: workflow.metadata?.createdBy || 'system'
            }
          };
        });
        
        return id;
      },

      updateWorkflow: (id, updates) => {
        set((state) => {
          if (state.workflows[id]) {
            Object.assign(state.workflows[id], updates);
            state.workflows[id].metadata!.updatedAt = new Date();
          }
        });
      },

      deleteWorkflow: (id) => {
        set((state) => {
          delete state.workflows[id];
          delete state.workflowStatistics[id];
          
          // Remove from execution history
          state.executionHistory = state.executionHistory.filter(
            h => h.workflowId !== id
          );
          
          // Clear selection if deleted workflow was selected
          if (state.selectedWorkflow === id) {
            state.selectedWorkflow = null;
            state.selectedNode = null;
          }
        });
      },

      duplicateWorkflow: (id) => {
        const workflow = get().workflows[id];
        if (!workflow) return '';
        
        const newId = uuidv4();
        const duplicatedWorkflow = {
          ...workflow,
          id: newId,
          name: `${workflow.name} (Copy)`,
          metadata: {
            ...workflow.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        set((state) => {
          state.workflows[newId] = duplicatedWorkflow;
        });
        
        return newId;
      },

      addNode: (workflowId, node) => {
        set((state) => {
          if (state.workflows[workflowId]) {
            state.workflows[workflowId].nodes.push(node);
            state.workflows[workflowId].metadata!.updatedAt = new Date();
          }
        });
      },

      updateNode: (workflowId, nodeId, updates) => {
        set((state) => {
          const workflow = state.workflows[workflowId];
          if (workflow) {
            const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
              Object.assign(workflow.nodes[nodeIndex], updates);
              workflow.metadata!.updatedAt = new Date();
            }
          }
        });
      },

      removeNode: (workflowId, nodeId) => {
        set((state) => {
          const workflow = state.workflows[workflowId];
          if (workflow) {
            // Remove node
            workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId);
            
            // Remove connected edges
            workflow.edges = workflow.edges.filter(
              e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
            );
            
            workflow.metadata!.updatedAt = new Date();
            
            // Clear selection if deleted node was selected
            if (state.selectedNode === nodeId) {
              state.selectedNode = null;
            }
          }
        });
      },

      addEdge: (workflowId, edge) => {
        set((state) => {
          if (state.workflows[workflowId]) {
            state.workflows[workflowId].edges.push(edge);
            state.workflows[workflowId].metadata!.updatedAt = new Date();
          }
        });
      },

      updateEdge: (workflowId, edgeId, updates) => {
        set((state) => {
          const workflow = state.workflows[workflowId];
          if (workflow) {
            const edgeIndex = workflow.edges.findIndex(e => e.id === edgeId);
            if (edgeIndex !== -1) {
              Object.assign(workflow.edges[edgeIndex], updates);
              workflow.metadata!.updatedAt = new Date();
            }
          }
        });
      },

      removeEdge: (workflowId, edgeId) => {
        set((state) => {
          const workflow = state.workflows[workflowId];
          if (workflow) {
            workflow.edges = workflow.edges.filter(e => e.id !== edgeId);
            workflow.metadata!.updatedAt = new Date();
          }
        });
      },

      startExecution: (workflowId, initialData = {}) => {
        const executionId = uuidv4();
        const now = new Date();
        
        set((state) => {
          state.activeExecutions[executionId] = {
            executionId,
            workflowId,
            startTime: now,
            state: WorkflowState.RUNNING,
            currentNodeId: null,
            data: initialData,
            errors: [],
            completedNodes: [],
            variables: {},
            user: {
              id: 'system',
              name: 'System'
            }
          };
          state.isExecuting = true;
        });
        
        return executionId;
      },

      updateExecution: (executionId, updates) => {
        set((state) => {
          if (state.activeExecutions[executionId]) {
            Object.assign(state.activeExecutions[executionId], updates);
          }
        });
      },

      completeExecution: (executionId, result) => {
        set((state) => {
          const execution = state.activeExecutions[executionId];
          if (execution) {
            execution.state = result.success ? WorkflowState.COMPLETED : WorkflowState.FAILED;
            execution.endTime = new Date();
            
            // Add to history
            const history: WorkflowHistory = {
              executionId,
              workflowId: execution.workflowId,
              workflowVersion: state.workflows[execution.workflowId]?.version || '1.0.0',
              startTime: execution.startTime,
              endTime: execution.endTime,
              state: execution.state,
              result,
              events: [],
              nodeExecutions: []
            };
            
            state.executionHistory.unshift(history);
            
            // Update statistics
            get().updateStatistics(execution.workflowId, result);
            
            // Remove from active executions
            delete state.activeExecutions[executionId];
            
            // Update executing state
            state.isExecuting = Object.keys(state.activeExecutions).length > 0;
          }
        });
      },

      cancelExecution: (executionId) => {
        set((state) => {
          const execution = state.activeExecutions[executionId];
          if (execution) {
            execution.state = WorkflowState.CANCELLED;
            execution.endTime = new Date();
            
            delete state.activeExecutions[executionId];
            state.isExecuting = Object.keys(state.activeExecutions).length > 0;
          }
        });
      },

      addToHistory: (history) => {
        set((state) => {
          state.executionHistory.unshift(history);
          // Keep only last 100 executions
          if (state.executionHistory.length > 100) {
            state.executionHistory = state.executionHistory.slice(0, 100);
          }
        });
      },

      clearHistory: () => {
        set((state) => {
          state.executionHistory = [];
        });
      },

      getExecutionHistory: (workflowId) => {
        const history = get().executionHistory;
        return workflowId 
          ? history.filter(h => h.workflowId === workflowId)
          : history;
      },

      updateStatistics: (workflowId, executionResult) => {
        set((state) => {
          if (!state.workflowStatistics[workflowId]) {
            state.workflowStatistics[workflowId] = {
              workflowId,
              totalExecutions: 0,
              successfulExecutions: 0,
              failedExecutions: 0,
              averageDuration: 0,
              nodeStatistics: new Map()
            };
          }
          
          const stats = state.workflowStatistics[workflowId];
          stats.totalExecutions++;
          
          if (executionResult.success) {
            stats.successfulExecutions++;
          } else {
            stats.failedExecutions++;
          }
          
          // Update average duration
          const oldAvg = stats.averageDuration;
          const newDuration = executionResult.duration;
          stats.averageDuration = (oldAvg * (stats.totalExecutions - 1) + newDuration) / stats.totalExecutions;
          
          stats.lastExecutionTime = new Date();
        });
      },

      getStatistics: (workflowId) => {
        return get().workflowStatistics[workflowId] || null;
      },

      setSelectedWorkflow: (workflowId) => {
        set((state) => {
          state.selectedWorkflow = workflowId;
          state.selectedNode = null; // Clear node selection when workflow changes
        });
      },

      setSelectedNode: (nodeId) => {
        set((state) => {
          state.selectedNode = nodeId;
        });
      },

      setIsExecuting: (executing) => {
        set((state) => {
          state.isExecuting = executing;
        });
      },

      addError: (error) => {
        set((state) => {
          state.errors.push(error);
        });
      },

      clearErrors: () => {
        set((state) => {
          state.errors = [];
        });
      },

      exportWorkflow: (workflowId) => {
        return get().workflows[workflowId] || null;
      },

      importWorkflow: (workflow) => {
        const id = workflow.id || uuidv4();
        
        set((state) => {
          state.workflows[id] = {
            ...workflow,
            id,
            metadata: {
              ...workflow.metadata,
              updatedAt: new Date()
            }
          };
        });
        
        return id;
      },

      exportAllWorkflows: () => {
        return Object.values(get().workflows);
      },

      importWorkflows: (workflows) => {
        set((state) => {
          workflows.forEach(workflow => {
            const id = workflow.id || uuidv4();
            state.workflows[id] = {
              ...workflow,
              id,
              metadata: {
                ...workflow.metadata,
                updatedAt: new Date()
              }
            };
          });
        });
      }
    })),
    {
      name: 'workflow-store',
      partialize: (state) => ({
        workflows: state.workflows,
        workflowStatistics: state.workflowStatistics,
        executionHistory: state.executionHistory.slice(0, 50) // Persist only recent history
      })
    }
  )
);

// Selectors for better performance
export const useWorkflow = (workflowId: string | null) =>
  useWorkflowStore((state) => workflowId ? state.workflows[workflowId] : null);

export const useWorkflows = () =>
  useWorkflowStore((state) => Object.values(state.workflows));

export const useActiveExecutions = () =>
  useWorkflowStore((state) => Object.values(state.activeExecutions));

export const useWorkflowStatistics = (workflowId: string) =>
  useWorkflowStore((state) => state.workflowStatistics[workflowId]);

export const useExecutionHistory = (workflowId?: string) =>
  useWorkflowStore((state) => state.getExecutionHistory(workflowId));
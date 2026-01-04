import { eq, desc, and, sql, count } from 'drizzle-orm';
import { getDb } from './connection';
import * as schema from './schema';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Workflow as DbWorkflow,
  NewWorkflow,
  WorkflowExecution as DbWorkflowExecution,
  NewWorkflowExecution,
  NodeExecution as DbNodeExecution,
  NewNodeExecution,
  WorkflowVariable as DbWorkflowVariable,
  NewWorkflowVariable,
  WorkflowTrigger as DbWorkflowTrigger,
  NewWorkflowTrigger,
  WorkflowStat,
  NodeStat,
  AuditLog,
  NewAuditLog,
  PolicyWorkflow,
  TrustWorkflow
} from './schema';
import type { 
  Workflow, 
  WorkflowExecutionContext, 
  ExecutionResult,
  WorkflowHistory,
  WorkflowStatistics 
} from '../types/WorkflowTypes';

export class WorkflowRepository {
  private db = getDb();

  // Workflow CRUD operations
  async createWorkflow(workflow: Partial<Workflow>): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    
    const newWorkflow: NewWorkflow = {
      id,
      name: workflow.name || 'New Workflow',
      description: workflow.description || '',
      version: workflow.version || '1.0.0',
      definition: {
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        variables: workflow.variables || {},
        settings: workflow.settings || {},
        metadata: workflow.metadata || {}
      },
      status: 'draft',
      createdBy: workflow.metadata?.createdBy || 'system',
      createdAt: now,
      updatedAt: now,
      category: workflow.metadata?.category,
      tags: workflow.metadata?.tags || []
    };

    await this.db.insert(schema.workflows).values(newWorkflow);
    return id;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const result = await this.db
      .select()
      .from(schema.workflows)
      .where(eq(schema.workflows.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const dbWorkflow = result[0];
    return this.mapDbWorkflowToWorkflow(dbWorkflow);
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    const existing = await this.getWorkflow(id);
    if (!existing) throw new Error(`Workflow ${id} not found`);

    const updateData: Partial<NewWorkflow> = {
      updatedAt: new Date()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.version) updateData.version = updates.version;
    
    if (updates.nodes || updates.edges || updates.variables || updates.settings) {
      updateData.definition = {
        nodes: updates.nodes || existing.nodes,
        edges: updates.edges || existing.edges,
        variables: updates.variables || existing.variables,
        settings: updates.settings || existing.settings,
        metadata: updates.metadata || existing.metadata
      };
    }

    await this.db
      .update(schema.workflows)
      .set(updateData)
      .where(eq(schema.workflows.id, id));

    // Log the update
    await this.logAudit('workflow', id, 'update', updates);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.db
      .delete(schema.workflows)
      .where(eq(schema.workflows.id, id));

    await this.logAudit('workflow', id, 'delete');
  }

  async listWorkflows(limit = 50, offset = 0): Promise<Workflow[]> {
    const results = await this.db
      .select()
      .from(schema.workflows)
      .orderBy(desc(schema.workflows.updatedAt))
      .limit(limit)
      .offset(offset);

    return results.map(this.mapDbWorkflowToWorkflow);
  }

  async searchWorkflows(query: string, limit = 50): Promise<Workflow[]> {
    const results = await this.db
      .select()
      .from(schema.workflows)
      .where(
        sql`${schema.workflows.name} ILIKE ${`%${query}%`} OR ${schema.workflows.description} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(schema.workflows.updatedAt))
      .limit(limit);

    return results.map(this.mapDbWorkflowToWorkflow);
  }

  // Execution operations
  async createExecution(execution: WorkflowExecutionContext): Promise<string> {
    const newExecution: NewWorkflowExecution = {
      id: execution.executionId,
      workflowId: execution.workflowId,
      workflowVersion: '1.0.0', // Should be retrieved from workflow
      status: execution.state,
      startTime: execution.startTime,
      triggeredBy: execution.user?.id || 'system',
      triggerType: 'manual',
      inputData: execution.data,
      metadata: {
        variables: execution.variables,
        completedNodes: execution.completedNodes
      }
    };

    await this.db.insert(schema.workflowExecutions).values(newExecution);
    return execution.executionId;
  }

  async updateExecution(
    executionId: string, 
    updates: Partial<WorkflowExecutionContext> & { result?: ExecutionResult }
  ): Promise<void> {
    const updateData: Partial<NewWorkflowExecution> = {};

    if (updates.state) updateData.status = updates.state;
    if (updates.endTime) updateData.endTime = updates.endTime;
    if (updates.data) updateData.inputData = updates.data;
    
    if (updates.result) {
      updateData.outputData = updates.result.data;
      updateData.duration = updates.result.duration;
      if (!updates.result.success && updates.result.error) {
        updateData.errorMessage = updates.result.error;
      }
    }

    if (updates.errors && updates.errors.length > 0) {
      updateData.errorMessage = updates.errors[0].message;
    }

    await this.db
      .update(schema.workflowExecutions)
      .set(updateData)
      .where(eq(schema.workflowExecutions.id, executionId));
  }

  async getExecutionHistory(workflowId?: string, limit = 100): Promise<WorkflowHistory[]> {
    let query = this.db
      .select({
        execution: schema.workflowExecutions,
        workflow: schema.workflows
      })
      .from(schema.workflowExecutions)
      .leftJoin(schema.workflows, eq(schema.workflowExecutions.workflowId, schema.workflows.id))
      .orderBy(desc(schema.workflowExecutions.startTime))
      .limit(limit);

    if (workflowId) {
      query = query.where(eq(schema.workflowExecutions.workflowId, workflowId)) as any;
    }

    const results = await query;

    return results.map(({ execution, workflow }) => ({
      executionId: execution.id,
      workflowId: execution.workflowId,
      workflowVersion: execution.workflowVersion,
      startTime: execution.startTime,
      endTime: execution.endTime || undefined,
      state: execution.status as any,
      result: execution.outputData ? {
        success: execution.status === 'completed',
        data: execution.outputData,
        error: execution.errorMessage || undefined,
        executionId: execution.id,
        duration: execution.duration || 0
      } : undefined,
      events: [], // Would need separate events table
      nodeExecutions: [] // Would populate from nodeExecutions table
    }));
  }

  // Node execution tracking
  async createNodeExecution(nodeExecution: {
    executionId: string;
    nodeId: string;
    nodeType: string;
    status: string;
    startTime: Date;
    inputData?: any;
  }): Promise<string> {
    const id = uuidv4();
    
    const newNodeExecution: NewNodeExecution = {
      id,
      executionId: nodeExecution.executionId,
      nodeId: nodeExecution.nodeId,
      nodeType: nodeExecution.nodeType,
      status: nodeExecution.status,
      startTime: nodeExecution.startTime,
      inputData: nodeExecution.inputData
    };

    await this.db.insert(schema.nodeExecutions).values(newNodeExecution);
    return id;
  }

  async updateNodeExecution(id: string, updates: {
    status?: string;
    endTime?: Date;
    outputData?: any;
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    await this.db
      .update(schema.nodeExecutions)
      .set(updates)
      .where(eq(schema.nodeExecutions.id, id));
  }

  // Variables
  async upsertWorkflowVariable(variable: {
    workflowId: string;
    name: string;
    type: string;
    value: any;
    isSecret?: boolean;
    description?: string;
  }): Promise<void> {
    const existing = await this.db
      .select()
      .from(schema.workflowVariables)
      .where(
        and(
          eq(schema.workflowVariables.workflowId, variable.workflowId),
          eq(schema.workflowVariables.name, variable.name)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(schema.workflowVariables)
        .set({
          value: variable.value,
          type: variable.type,
          isSecret: variable.isSecret,
          description: variable.description,
          updatedAt: new Date()
        })
        .where(eq(schema.workflowVariables.id, existing[0].id));
    } else {
      const newVariable: NewWorkflowVariable = {
        id: uuidv4(),
        workflowId: variable.workflowId,
        name: variable.name,
        type: variable.type,
        value: variable.value,
        isSecret: variable.isSecret || false,
        description: variable.description
      };

      await this.db.insert(schema.workflowVariables).values(newVariable);
    }
  }

  async getWorkflowVariables(workflowId: string): Promise<DbWorkflowVariable[]> {
    return await this.db
      .select()
      .from(schema.workflowVariables)
      .where(eq(schema.workflowVariables.workflowId, workflowId));
  }

  // Statistics
  async updateWorkflowStats(workflowId: string, executionResult: ExecutionResult): Promise<void> {
    const existing = await this.db
      .select()
      .from(schema.workflowStats)
      .where(eq(schema.workflowStats.workflowId, workflowId))
      .limit(1);

    if (existing.length > 0) {
      const stats = existing[0];
      const newTotal = stats.totalExecutions + 1;
      const newSuccessful = stats.successfulExecutions + (executionResult.success ? 1 : 0);
      const newFailed = stats.failedExecutions + (executionResult.success ? 0 : 1);
      
      // Calculate new average duration
      const oldAvg = Number(stats.averageDuration) || 0;
      const newAvg = (oldAvg * stats.totalExecutions + executionResult.duration) / newTotal;

      await this.db
        .update(schema.workflowStats)
        .set({
          totalExecutions: newTotal,
          successfulExecutions: newSuccessful,
          failedExecutions: newFailed,
          averageDuration: newAvg.toString(),
          lastExecutionTime: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.workflowStats.id, stats.id));
    } else {
      const newStats = {
        id: uuidv4(),
        workflowId,
        totalExecutions: 1,
        successfulExecutions: executionResult.success ? 1 : 0,
        failedExecutions: executionResult.success ? 0 : 1,
        averageDuration: executionResult.duration.toString(),
        lastExecutionTime: new Date()
      };

      await this.db.insert(schema.workflowStats).values(newStats);
    }
  }

  async getWorkflowStatistics(workflowId: string): Promise<WorkflowStatistics | null> {
    const result = await this.db
      .select()
      .from(schema.workflowStats)
      .where(eq(schema.workflowStats.workflowId, workflowId))
      .limit(1);

    if (result.length === 0) return null;

    const stats = result[0];
    return {
      workflowId: stats.workflowId,
      totalExecutions: stats.totalExecutions,
      successfulExecutions: stats.successfulExecutions,
      failedExecutions: stats.failedExecutions,
      averageDuration: Number(stats.averageDuration) || 0,
      lastExecutionTime: stats.lastExecutionTime || undefined,
      nodeStatistics: new Map() // Would need to aggregate from nodeStats table
    };
  }

  // ATP-specific operations
  async createPolicyWorkflowMapping(mapping: {
    policyId: string;
    workflowId: string;
    triggerEvent: string;
    priority?: number;
  }): Promise<void> {
    const newMapping = {
      id: uuidv4(),
      policyId: mapping.policyId,
      workflowId: mapping.workflowId,
      triggerEvent: mapping.triggerEvent,
      priority: mapping.priority || 0
    };

    await this.db.insert(schema.policyWorkflows).values(newMapping);
  }

  async createTrustWorkflowMapping(mapping: {
    agentDid?: string;
    workflowId: string;
    triggerEvent: string;
    thresholds?: any;
  }): Promise<void> {
    const newMapping = {
      id: uuidv4(),
      agentDid: mapping.agentDid,
      workflowId: mapping.workflowId,
      triggerEvent: mapping.triggerEvent,
      thresholds: mapping.thresholds
    };

    await this.db.insert(schema.trustWorkflows).values(newMapping);
  }

  // Audit logging
  private async logAudit(
    entityType: string,
    entityId: string,
    action: string,
    changes?: any,
    userId?: string
  ): Promise<void> {
    const auditLog: NewAuditLog = {
      id: uuidv4(),
      entityType,
      entityId,
      action,
      userId,
      changes,
      timestamp: new Date()
    };

    await this.db.insert(schema.auditLogs).values(auditLog);
  }

  // Helper method to map database workflow to application workflow
  private mapDbWorkflowToWorkflow(dbWorkflow: DbWorkflow): Workflow {
    const definition = dbWorkflow.definition as any;
    
    return {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      description: dbWorkflow.description || '',
      version: dbWorkflow.version,
      nodes: definition.nodes || [],
      edges: definition.edges || [],
      triggers: definition.triggers || [],
      variables: definition.variables || {},
      settings: definition.settings || {},
      metadata: {
        createdAt: dbWorkflow.createdAt,
        updatedAt: dbWorkflow.updatedAt,
        createdBy: dbWorkflow.createdBy || undefined,
        category: dbWorkflow.category || undefined,
        tags: Array.isArray(dbWorkflow.tags) ? dbWorkflow.tags : [],
        ...definition.metadata
      }
    };
  }
}

// Auto-initialize database if not already done
function ensureDatabaseInitialized() {
  if (!dbConnection.isConnected()) {
    try {
      dbConnection.initializeFromEnv();
    } catch (error) {
      console.warn('Could not auto-initialize database:', error);
    }
  }
}

// Export singleton instance with auto-initialization
let workflowRepositoryInstance: WorkflowRepository | null = null;

function getWorkflowRepositoryInstance(): WorkflowRepository {
  if (!workflowRepositoryInstance) {
    ensureDatabaseInitialized();
    workflowRepositoryInstance = new WorkflowRepository();
  }
  return workflowRepositoryInstance;
}

// Create a proxy that auto-initializes
export const workflowRepository = new Proxy({} as WorkflowRepository, {
  get(target, prop) {
    const instance = getWorkflowRepositoryInstance();
    const value = instance[prop as keyof WorkflowRepository];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
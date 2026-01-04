import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Workflows table
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
  definition: jsonb('definition').notNull(), // Complete workflow definition
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, active, archived
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isTemplate: boolean('is_template').notNull().default(false),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').default('[]'), // Array of tags
});

// Workflow executions table
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  workflowVersion: varchar('workflow_version', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // running, completed, failed, cancelled
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // milliseconds
  triggeredBy: varchar('triggered_by', { length: 255 }),
  triggerType: varchar('trigger_type', { length: 100 }),
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
});

// Node executions table (for detailed execution tracking)
export const nodeExecutions = pgTable('node_executions', {
  id: uuid('id').primaryKey(),
  executionId: uuid('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 255 }).notNull(),
  nodeType: varchar('node_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // pending, running, success, failed, skipped
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // milliseconds
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
});

// Workflow variables table
export const workflowVariables = pgTable('workflow_variables', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // string, number, boolean, object, array
  value: jsonb('value'),
  isSecret: boolean('is_secret').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow triggers table
export const workflowTriggers = pgTable('workflow_triggers', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(), // manual, schedule, webhook, event
  name: varchar('name', { length: 255 }).notNull(),
  configuration: jsonb('configuration').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  triggerCount: integer('trigger_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow statistics table
export const workflowStats = pgTable('workflow_stats', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  totalExecutions: integer('total_executions').notNull().default(0),
  successfulExecutions: integer('successful_executions').notNull().default(0),
  failedExecutions: integer('failed_executions').notNull().default(0),
  averageDuration: decimal('average_duration', { precision: 10, scale: 2 }),
  lastExecutionTime: timestamp('last_execution_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Node statistics table
export const nodeStats = pgTable('node_stats', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 255 }).notNull(),
  nodeType: varchar('node_type', { length: 100 }).notNull(),
  totalExecutions: integer('total_executions').notNull().default(0),
  successfulExecutions: integer('successful_executions').notNull().default(0),
  failedExecutions: integer('failed_executions').notNull().default(0),
  averageDuration: decimal('average_duration', { precision: 10, scale: 2 }),
  lastExecutionTime: timestamp('last_execution_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Audit log table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // workflow, execution, variable
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete, execute
  userId: varchar('user_id', { length: 255 }),
  userName: varchar('user_name', { length: 255 }),
  changes: jsonb('changes'), // What changed
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Policy workflow mappings (ATP-specific)
export const policyWorkflows = pgTable('policy_workflows', {
  id: uuid('id').primaryKey(),
  policyId: varchar('policy_id', { length: 255 }).notNull(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(), // policy_created, policy_updated, policy_violated
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Trust workflow mappings (ATP-specific)
export const trustWorkflows = pgTable('trust_workflows', {
  id: uuid('id').primaryKey(),
  agentDid: varchar('agent_did', { length: 500 }),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(), // trust_changed, risk_detected
  thresholds: jsonb('thresholds'), // Trust level thresholds
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const workflowsRelations = relations(workflows, ({ many }) => ({
  executions: many(workflowExecutions),
  variables: many(workflowVariables),
  triggers: many(workflowTriggers),
  stats: many(workflowStats),
  nodeStats: many(nodeStats),
  policyMappings: many(policyWorkflows),
  trustMappings: many(trustWorkflows),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
  nodeExecutions: many(nodeExecutions),
}));

export const nodeExecutionsRelations = relations(nodeExecutions, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [nodeExecutions.executionId],
    references: [workflowExecutions.id],
  }),
}));

export const workflowVariablesRelations = relations(workflowVariables, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVariables.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowTriggersRelations = relations(workflowTriggers, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowTriggers.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowStatsRelations = relations(workflowStats, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowStats.workflowId],
    references: [workflows.id],
  }),
}));

export const nodeStatsRelations = relations(nodeStats, ({ one }) => ({
  workflow: one(workflows, {
    fields: [nodeStats.workflowId],
    references: [workflows.id],
  }),
}));

export const policyWorkflowsRelations = relations(policyWorkflows, ({ one }) => ({
  workflow: one(workflows, {
    fields: [policyWorkflows.workflowId],
    references: [workflows.id],
  }),
}));

export const trustWorkflowsRelations = relations(trustWorkflows, ({ one }) => ({
  workflow: one(workflows, {
    fields: [trustWorkflows.workflowId],
    references: [workflows.id],
  }),
}));

// Type exports for use in application
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type NodeExecution = typeof nodeExecutions.$inferSelect;
export type NewNodeExecution = typeof nodeExecutions.$inferInsert;
export type WorkflowVariable = typeof workflowVariables.$inferSelect;
export type NewWorkflowVariable = typeof workflowVariables.$inferInsert;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type NewWorkflowTrigger = typeof workflowTriggers.$inferInsert;
export type WorkflowStat = typeof workflowStats.$inferSelect;
export type NewWorkflowStat = typeof workflowStats.$inferInsert;
export type NodeStat = typeof nodeStats.$inferSelect;
export type NewNodeStat = typeof nodeStats.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type PolicyWorkflow = typeof policyWorkflows.$inferSelect;
export type NewPolicyWorkflow = typeof policyWorkflows.$inferInsert;
export type TrustWorkflow = typeof trustWorkflows.$inferSelect;
export type NewTrustWorkflow = typeof trustWorkflows.$inferInsert;
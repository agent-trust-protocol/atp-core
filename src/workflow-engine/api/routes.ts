import express from 'express';
import { z } from 'zod';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { NodeRegistry } from '../core/NodeRegistry';
import { workflowRepository } from '../database/repository';
import { dbConnection, healthCheck } from '../database/connection';
import { policyNodeDefinitions } from '../nodes/atp/PolicyNodes';
import { trustNodeDefinitions } from '../nodes/atp/TrustNodes';
import { monitoringNodeDefinitions } from '../nodes/atp/MonitoringNodes';

const router = express.Router();

// Initialize workflow engine and node registry
const nodeRegistry = new NodeRegistry();
const workflowEngine = new WorkflowEngine(nodeRegistry);

// Register ATP nodes
[...policyNodeDefinitions, ...trustNodeDefinitions, ...monitoringNodeDefinitions].forEach(def => {
  nodeRegistry.registerNode(def);
});

// Validation schemas
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
  variables: z.record(z.any()).default({}),
  settings: z.object({
    maxExecutionTime: z.number().optional(),
    retryPolicy: z.object({
      maxRetries: z.number(),
      retryDelay: z.number(),
      backoffMultiplier: z.number().optional()
    }).optional(),
    errorHandling: z.enum(['stop', 'continue', 'retry']).optional(),
    notifications: z.object({
      onStart: z.boolean().optional(),
      onComplete: z.boolean().optional(),
      onError: z.boolean().optional(),
      channels: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  metadata: z.object({
    createdBy: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
});

const executeWorkflowSchema = z.object({
  initialData: z.record(z.any()).optional(),
  context: z.object({
    user: z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional()
    }).optional()
  }).optional()
});

const updateWorkflowSchema = createWorkflowSchema.partial();

// Middleware for error handling
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware for request validation
const validate = (schema: z.ZodSchema) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    next(error);
  }
};

// Health check endpoint
router.get('/health', asyncHandler(async (req: express.Request, res: express.Response) => {
  const dbHealth = await healthCheck();
  const nodeCount = nodeRegistry.getAllNodes().length;
  
  res.json({
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      nodeRegistry: {
        status: 'healthy',
        registeredNodes: nodeCount,
        categories: nodeRegistry.getAllCategories().length
      },
      workflowEngine: {
        status: 'healthy',
        activeExecutions: workflowEngine.getActiveExecutions().length
      }
    }
  });
}));

// Node management endpoints
router.get('/nodes', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { category, search } = req.query;
  
  let nodes = nodeRegistry.getAllNodes();
  
  if (category) {
    nodes = nodeRegistry.getNodesByCategory(category as any);
  }
  
  if (search) {
    nodes = nodeRegistry.searchNodes(search as string);
  }
  
  res.json({
    nodes: nodes.map(node => ({
      type: node.type,
      category: node.category,
      label: node.label,
      description: node.description,
      icon: node.icon,
      color: node.color,
      inputs: node.inputs,
      outputs: node.outputs
    }))
  });
}));

router.get('/nodes/categories', asyncHandler(async (req: express.Request, res: express.Response) => {
  const categories = nodeRegistry.getAllCategories();
  res.json({ categories });
}));

router.get('/nodes/:type/schema', asyncHandler(async (req: express.Request, res: express.Response) => {
  const schema = nodeRegistry.getNodeSchema(req.params.type);
  if (!schema) {
    return res.status(404).json({ error: 'Node type not found' });
  }
  res.json(schema);
}));

// Workflow CRUD endpoints
router.post('/workflows', validate(createWorkflowSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflowId = await workflowRepository.createWorkflow(req.body);
  
  const workflow = await workflowRepository.getWorkflow(workflowId);
  res.status(201).json({
    id: workflowId,
    workflow
  });
}));

router.get('/workflows', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { limit = 50, offset = 0, search } = req.query;
  
  let workflows;
  if (search) {
    workflows = await workflowRepository.searchWorkflows(search as string, Number(limit));
  } else {
    workflows = await workflowRepository.listWorkflows(Number(limit), Number(offset));
  }
  
  res.json({ workflows });
}));

router.get('/workflows/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json({ workflow });
}));

router.put('/workflows/:id', validate(updateWorkflowSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  await workflowRepository.updateWorkflow(req.params.id, req.body);
  
  const updatedWorkflow = await workflowRepository.getWorkflow(req.params.id);
  res.json({ workflow: updatedWorkflow });
}));

router.delete('/workflows/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  await workflowRepository.deleteWorkflow(req.params.id);
  res.status(204).send();
}));

// Workflow execution endpoints
router.post('/workflows/:id/execute', validate(executeWorkflowSchema), asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  // Register workflow with engine if not already registered
  try {
    await workflowEngine.registerWorkflow(workflow);
  } catch (error) {
    // Workflow might already be registered, continue
  }
  
  const result = await workflowEngine.executeWorkflow(
    req.params.id,
    req.body.initialData,
    req.body.context
  );
  
  // Update statistics
  await workflowRepository.updateWorkflowStats(req.params.id, result);
  
  res.json({ result });
}));

router.post('/workflows/:id/validate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  try {
    await workflowEngine.registerWorkflow(workflow);
    res.json({ 
      isValid: true,
      errors: [],
      warnings: []
    });
  } catch (error) {
    res.json({
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Validation failed'],
      warnings: []
    });
  }
}));

// Execution management endpoints
router.get('/executions', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { workflowId, limit = 100 } = req.query;
  
  const history = await workflowRepository.getExecutionHistory(
    workflowId as string,
    Number(limit)
  );
  
  res.json({ executions: history });
}));

router.get('/executions/active', asyncHandler(async (req: express.Request, res: express.Response) => {
  const activeExecutions = workflowEngine.getActiveExecutions();
  res.json({ executions: activeExecutions });
}));

router.post('/executions/:id/cancel', asyncHandler(async (req: express.Request, res: express.Response) => {
  const execution = workflowEngine.getExecutionContext(req.params.id);
  
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  
  workflowEngine.cancelExecution(req.params.id);
  res.json({ message: 'Execution cancelled' });
}));

router.post('/executions/:id/pause', asyncHandler(async (req: express.Request, res: express.Response) => {
  const execution = workflowEngine.getExecutionContext(req.params.id);
  
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  
  workflowEngine.pauseExecution(req.params.id);
  res.json({ message: 'Execution paused' });
}));

router.post('/executions/:id/resume', asyncHandler(async (req: express.Request, res: express.Response) => {
  const execution = workflowEngine.getExecutionContext(req.params.id);
  
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  
  workflowEngine.resumeExecution(req.params.id);
  res.json({ message: 'Execution resumed' });
}));

// Statistics endpoints
router.get('/workflows/:id/statistics', asyncHandler(async (req: express.Request, res: express.Response) => {
  const statistics = await workflowRepository.getWorkflowStatistics(req.params.id);
  
  if (!statistics) {
    return res.status(404).json({ error: 'Statistics not found' });
  }
  
  res.json({ statistics });
}));

// Variable management endpoints
router.get('/workflows/:id/variables', asyncHandler(async (req: express.Request, res: express.Response) => {
  const variables = await workflowRepository.getWorkflowVariables(req.params.id);
  res.json({ variables });
}));

router.post('/workflows/:id/variables', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, type, value, isSecret, description } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  
  await workflowRepository.upsertWorkflowVariable({
    workflowId: req.params.id,
    name,
    type,
    value,
    isSecret,
    description
  });
  
  res.status(201).json({ message: 'Variable saved' });
}));

// ATP-specific endpoints
router.post('/workflows/:id/policy-mapping', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { policyId, triggerEvent, priority } = req.body;
  
  if (!policyId || !triggerEvent) {
    return res.status(400).json({ error: 'Policy ID and trigger event are required' });
  }
  
  await workflowRepository.createPolicyWorkflowMapping({
    policyId,
    workflowId: req.params.id,
    triggerEvent,
    priority
  });
  
  res.status(201).json({ message: 'Policy mapping created' });
}));

router.post('/workflows/:id/trust-mapping', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { agentDid, triggerEvent, thresholds } = req.body;
  
  if (!triggerEvent) {
    return res.status(400).json({ error: 'Trigger event is required' });
  }
  
  await workflowRepository.createTrustWorkflowMapping({
    agentDid,
    workflowId: req.params.id,
    triggerEvent,
    thresholds
  });
  
  res.status(201).json({ message: 'Trust mapping created' });
}));

// Import/Export endpoints
router.post('/workflows/import', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { workflows } = req.body;
  
  if (!Array.isArray(workflows)) {
    return res.status(400).json({ error: 'Workflows must be an array' });
  }
  
  const importedIds = [];
  for (const workflow of workflows) {
    const id = await workflowRepository.createWorkflow(workflow);
    importedIds.push(id);
  }
  
  res.json({ 
    message: `${importedIds.length} workflows imported`,
    workflowIds: importedIds
  });
}));

router.get('/workflows/:id/export', asyncHandler(async (req: express.Request, res: express.Response) => {
  const workflow = await workflowRepository.getWorkflow(req.params.id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${workflow.name}.json"`);
  res.json(workflow);
}));

// Error handling middleware
router.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Workflow API Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;
import { Request, Response } from 'express';
import { PolicyEvaluator, VisualPolicyStorageService, PolicyEvaluationContext } from '@atp/shared';

export class PolicyEvaluationController {
  private evaluator: PolicyEvaluator;

  constructor(private storage: VisualPolicyStorageService) {
    this.evaluator = new PolicyEvaluator({ debugMode: true });
  }

  evaluate = async (req: Request, res: Response) => {
    try {
      const { policyId, context } = req.body as { 
        policyId: string; 
        context: PolicyEvaluationContext;
      };

      if (!policyId || !context) {
        return res.status(400).json({ 
          error: 'Missing required fields: policyId and context' 
        });
      }

      // Get the policy
      const policy = await this.storage.getPolicy(policyId, context.organizationId);
      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Evaluate the policy
      const result = await this.evaluator.evaluatePolicy(policy, context);

      // Record metrics
      await this.storage.recordEvaluation(
        policyId,
        result.decision as any,
        result.processingTime
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Evaluation failed', 
        details: error.message 
      });
    }
  };

  simulate = async (req: Request, res: Response) => {
    try {
      const { policyDocument, context } = req.body;

      if (!policyDocument || !context) {
        return res.status(400).json({ 
          error: 'Missing required fields: policyDocument and context' 
        });
      }

      // Evaluate the policy document directly (for simulation)
      const result = await this.evaluator.evaluatePolicy(policyDocument, context);

      res.json({
        ...result,
        simulation: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Simulation failed', 
        details: error.message 
      });
    }
  };
}
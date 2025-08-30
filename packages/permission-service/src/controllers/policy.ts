import { Request, Response } from 'express';
import { VisualPolicyStorageService, ATPVisualPolicy, validateATPPolicy, RedisCache, PerformanceOptimizer } from '@atp/shared';
import type { DatabaseConfig } from '@atp/shared';

export class PolicyController {
  constructor(
    private storage: VisualPolicyStorageService,
    private cache?: RedisCache,
    private performance?: PerformanceOptimizer
  ) {}

  create = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const body = req.body as { document: ATPVisualPolicy; name?: string; description?: string } & { organizationId?: string; createdBy?: string };
      const doc = validateATPPolicy(body.document);
      const id = await this.storage.createPolicy({ ...doc, name: body.name || doc.name, description: body.description || doc.description }, body.createdBy || 'system');
      
      // Invalidate related cache entries
      if (this.performance && this.cache) {
        await this.performance.invalidatePattern(`policy:*:${body.organizationId || 'default'}`);
        await this.performance.invalidatePattern(`policies:list:*`);
      }

      if (this.performance) {
        await this.performance.recordRequest('create_policy', Date.now() - startTime);
      }
      
      res.status(201).json({ id });
    } catch (e: any) {
      if (this.performance) {
        await this.performance.recordError('create_policy', e);
      }
      res.status(400).json({ error: e.message || 'Invalid policy' });
    }
  };

  get = async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const policyId = req.params.id;
      const organizationId = req.query.organizationId as string | undefined;
      const cacheKey = `policy:${policyId}:${organizationId || 'default'}`;

      let policy;
      if (this.performance && this.cache) {
        const result = await this.performance.withCache(
          cacheKey,
          () => this.storage.getPolicy(policyId, organizationId),
          300 // 5 minutes TTL
        );
        policy = result.data;
      } else {
        policy = await this.storage.getPolicy(policyId, organizationId);
      }

      if (!policy) return res.status(404).json({ error: 'Not found' });
      
      if (this.performance) {
        await this.performance.recordRequest('get_policy', Date.now() - startTime);
      }
      
      res.json(policy);
    } catch (e: any) {
      if (this.performance) {
        await this.performance.recordError('get_policy', e);
      }
      res.status(500).json({ error: e.message || 'Error fetching policy' });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const { policies, total } = await this.storage.searchPolicies({
        organizationId: (req.query.organizationId as string) || undefined,
        status: (req.query.status as any) || undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      });
      res.json({ total, policies });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error listing policies' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      await this.storage.updatePolicy(req.params.id, req.body.updates as Partial<ATPVisualPolicy>, req.body.updatedBy || 'system', req.body.reason);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Error updating policy' });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      await this.storage.deletePolicy(req.params.id, req.body.deletedBy || 'system', req.body.reason);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Error deleting policy' });
    }
  };
}



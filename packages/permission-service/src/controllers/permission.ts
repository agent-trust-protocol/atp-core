import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.js';
import { PermissionRequest, PermissionCheck, PolicyRule } from '../models/permission.js';

export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  async grant(req: Request, res: Response): Promise<void> {
    try {
      const request: PermissionRequest = req.body;
      const result = await this.permissionService.grantPermission(request);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async check(req: Request, res: Response): Promise<void> {
    try {
      const check: PermissionCheck = req.body;
      const result = await this.permissionService.checkPermission(check);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const result = await this.permissionService.validateToken(token);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const permissions = await this.permissionService.listPermissions(did);
      
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { grantId } = req.params;
      const { revoker } = req.body;
      
      await this.permissionService.revokePermission(grantId, revoker);
      
      res.json({
        success: true,
        message: 'Permission revoked successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async addPolicyRule(req: Request, res: Response): Promise<void> {
    try {
      const rule: PolicyRule = req.body;
      await this.permissionService.addPolicyRule(rule);
      
      res.status(201).json({
        success: true,
        message: 'Policy rule added successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async removePolicyRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      await this.permissionService.removePolicyRule(ruleId);
      
      res.json({
        success: true,
        message: 'Policy rule removed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async listPolicyRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await this.permissionService.listPolicyRules();
      
      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
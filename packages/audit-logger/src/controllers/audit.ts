import { Request, Response } from 'express';
import { AuditService } from '../services/audit.js';
import { AuditEventRequest, AuditQuery } from '../models/audit.js';

export class AuditController {
  constructor(private auditService: AuditService) {}

  async logEvent(req: Request, res: Response): Promise<void> {
    try {
      const request: AuditEventRequest = req.body;
      
      if (!request.source || !request.action || !request.resource) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: source, action, resource',
        });
        return;
      }

      const event = await this.auditService.logEvent(request);
      
      res.status(201).json({
        success: true,
        event,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await this.auditService.getEvent(id);
      
      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      res.json({
        success: true,
        event,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async queryEvents(req: Request, res: Response): Promise<void> {
    try {
      const query: AuditQuery = {
        source: req.query.source as string,
        action: req.query.action as string,
        resource: req.query.resource as string,
        actor: req.query.actor as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await this.auditService.queryEvents(query);
      
      res.json({
        success: true,
        events: result.events,
        total: result.total,
        query,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.auditService.verifyIntegrity();
      
      res.json({
        success: true,
        integrity: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.auditService.getStats();
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getEventFromIPFS(req: Request, res: Response): Promise<void> {
    try {
      const { hash } = req.params;
      const event = await this.auditService.getEventFromIPFS(hash);
      
      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Event not found in IPFS',
        });
        return;
      }

      res.json({
        success: true,
        event,
        source: 'ipfs',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
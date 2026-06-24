import { Request, Response } from 'express';
import { IdentityService } from '../services/identity.js';
import { DIDRegistrationRequest, PairwiseDIDRegistrationRequest } from '../models/did.js';

export class IdentityController {
  constructor(private identityService: IdentityService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const request: DIDRegistrationRequest = req.body;
      const result = await this.identityService.registerDID(request);

      res.status(201).json({
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

  async registerPairwise(req: Request, res: Response): Promise<void> {
    try {
      const request: PairwiseDIDRegistrationRequest = req.body;
      if (!request || !request.masterSecret || !request.peerId) {
        res.status(400).json({
          success: false,
          error: 'masterSecret and peerId are required',
        });
        return;
      }

      const result = await this.identityService.registerPairwiseDID(request);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // The service's throws on this path are input-validation failures
      // (bad hex, master secret too short, empty peerId), so report 400.
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const document = await this.identityService.resolveDID(did);
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const document = await this.identityService.resolveDID(did);
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async rotateKeys(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const document = await this.identityService.rotateKeys(did);
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: document,
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
      const dids = await this.identityService.listDIDs();
      
      res.json({
        success: true,
        data: dids,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateTrustLevel(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { trustLevel } = req.body;
      
      if (!trustLevel) {
        res.status(400).json({
          success: false,
          error: 'Trust level is required',
        });
        return;
      }
      
      const document = await this.identityService.updateTrustLevel(did, trustLevel);
      
      if (!document) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTrustLevelInfo(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const trustInfo = await this.identityService.getTrustLevelInfo(did);
      
      if (!trustInfo) {
        res.status(404).json({
          success: false,
          error: 'DID not found or trust level not set',
        });
        return;
      }

      res.json({
        success: true,
        data: trustInfo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
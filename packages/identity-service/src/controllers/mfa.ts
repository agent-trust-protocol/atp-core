import { Request, Response } from 'express';
import { IdentityMFAService } from '../services/mfa.js';
import { z } from 'zod';
import { Pool } from 'pg';
import '../types/express.js';

const MFASetupRequestSchema = z.object({
  did: z.string(),
  accountName: z.string(),
  method: z.enum(['totp', 'hardware'])
});

const MFAVerificationRequestSchema = z.object({
  did: z.string(),
  token: z.string().optional(),
  backupCode: z.string().optional(),
  hardwareResponse: z.object({
    signature: z.string(),
    challenge: z.string()
  }).optional()
});

const MFAConfirmRequestSchema = z.object({
  did: z.string(),
  verificationToken: z.string()
});

export class MFAController {
  private mfaService: IdentityMFAService;

  constructor(db: Pool) {
    this.mfaService = new IdentityMFAService(db);
  }

  /**
   * Setup MFA for a DID
   * POST /mfa/setup
   */
  async setupMFA(req: Request, res: Response): Promise<void> {
    try {
      const validation = MFASetupRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      // Verify the requesting DID matches the JWT subject
      const authenticatedDID = req.user?.did;
      if (authenticatedDID !== validation.data.did) {
        res.status(403).json({
          success: false,
          error: 'Cannot setup MFA for different DID'
        });
        return;
      }

      const result = await this.mfaService.setupMFA(validation.data);
      
      if (!result) {
        res.status(400).json({
          success: false,
          error: 'Failed to setup MFA'
        });
        return;
      }

      // Don't send backup codes in response for security
      const response = {
        success: true,
        data: {
          secret: result.secret,
          qrCode: result.qrCode,
          backupCodesCount: result.backupCodes.length
        }
      };

      // Store backup codes in session or separate secure endpoint
      req.session = req.session || {};
      req.session.pendingBackupCodes = result.backupCodes;

      res.status(200).json(response);
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Confirm MFA setup with verification
   * POST /mfa/confirm
   */
  async confirmMFA(req: Request, res: Response): Promise<void> {
    try {
      const validation = MFAConfirmRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      const authenticatedDID = req.user?.did;
      if (authenticatedDID !== validation.data.did) {
        res.status(403).json({
          success: false,
          error: 'Cannot confirm MFA for different DID'
        });
        return;
      }

      const success = await this.mfaService.confirmMFASetup(
        validation.data.did,
        validation.data.verificationToken
      );

      if (success) {
        // Return backup codes on successful confirmation
        const backupCodes = req.session?.pendingBackupCodes;
        delete req.session?.pendingBackupCodes;

        res.status(200).json({
          success: true,
          message: 'MFA enabled successfully',
          backupCodes: backupCodes || []
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid verification token'
        });
      }
    } catch (error) {
      console.error('MFA confirmation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Verify MFA during authentication
   * POST /mfa/verify
   */
  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const validation = MFAVerificationRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      const result = await this.mfaService.verifyMFA(validation.data);

      res.status(200).json({
        success: result.valid,
        method: result.method,
        message: result.valid ? 'MFA verification successful' : 'MFA verification failed'
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get MFA status for a DID
   * GET /mfa/status/:did
   */
  async getMFAStatus(req: Request, res: Response): Promise<void> {
    try {
      const did = req.params.did;
      
      if (!did) {
        res.status(400).json({
          success: false,
          error: 'DID parameter required'
        });
        return;
      }

      const authenticatedDID = req.user?.did;
      if (authenticatedDID !== did) {
        res.status(403).json({
          success: false,
          error: 'Cannot access MFA status for different DID'
        });
        return;
      }

      const status = await this.mfaService.getMFAStatus(did);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('MFA status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Disable MFA for a DID
   * POST /mfa/disable
   */
  async disableMFA(req: Request, res: Response): Promise<void> {
    try {
      const validation = MFAConfirmRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      const authenticatedDID = req.user?.did;
      if (authenticatedDID !== validation.data.did) {
        res.status(403).json({
          success: false,
          error: 'Cannot disable MFA for different DID'
        });
        return;
      }

      const success = await this.mfaService.disableMFA(
        validation.data.did,
        validation.data.verificationToken
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'MFA disabled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to disable MFA - invalid verification token'
        });
      }
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Regenerate backup codes
   * POST /mfa/backup-codes/regenerate
   */
  async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const validation = MFAConfirmRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
        return;
      }

      const authenticatedDID = req.user?.did;
      if (authenticatedDID !== validation.data.did) {
        res.status(403).json({
          success: false,
          error: 'Cannot regenerate backup codes for different DID'
        });
        return;
      }

      const backupCodes = await this.mfaService.regenerateBackupCodes(
        validation.data.did,
        validation.data.verificationToken
      );

      if (backupCodes) {
        res.status(200).json({
          success: true,
          message: 'Backup codes regenerated successfully',
          backupCodes
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to regenerate backup codes - invalid verification token'
        });
      }
    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
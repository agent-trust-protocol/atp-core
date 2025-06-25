import { Request, Response } from 'express';
import { IdentityService } from '../services/identity.js';
export declare class IdentityController {
    private identityService;
    constructor(identityService: IdentityService);
    register(req: Request, res: Response): Promise<void>;
    resolve(req: Request, res: Response): Promise<void>;
    getDocument(req: Request, res: Response): Promise<void>;
    rotateKeys(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    updateTrustLevel(req: Request, res: Response): Promise<void>;
    getTrustLevelInfo(req: Request, res: Response): Promise<void>;
}

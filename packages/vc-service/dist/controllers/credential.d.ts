import { Request, Response } from 'express';
import { CredentialService } from '../services/credential.js';
export declare class CredentialController {
    private credentialService;
    constructor(credentialService: CredentialService);
    issue(req: Request, res: Response): Promise<void>;
    verify(req: Request, res: Response): Promise<void>;
    revoke(req: Request, res: Response): Promise<void>;
    registerSchema(req: Request, res: Response): Promise<void>;
    getSchema(req: Request, res: Response): Promise<void>;
    listSchemas(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=credential.d.ts.map
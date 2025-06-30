import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.js';
export declare class PermissionController {
    private permissionService;
    constructor(permissionService: PermissionService);
    grant(req: Request, res: Response): Promise<void>;
    check(req: Request, res: Response): Promise<void>;
    validateToken(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    revoke(req: Request, res: Response): Promise<void>;
    addPolicyRule(req: Request, res: Response): Promise<void>;
    removePolicyRule(req: Request, res: Response): Promise<void>;
    listPolicyRules(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=permission.d.ts.map
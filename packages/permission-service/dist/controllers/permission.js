export class PermissionController {
    permissionService;
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    async grant(req, res) {
        try {
            const request = req.body;
            const result = await this.permissionService.grantPermission(request);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async check(req, res) {
        try {
            const check = req.body;
            const result = await this.permissionService.checkPermission(check);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async validateToken(req, res) {
        try {
            const { token } = req.body;
            const result = await this.permissionService.validateToken(token);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async list(req, res) {
        try {
            const { did } = req.params;
            const permissions = await this.permissionService.listPermissions(did);
            res.json({
                success: true,
                data: permissions,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async revoke(req, res) {
        try {
            const { grantId } = req.params;
            const { revoker } = req.body;
            await this.permissionService.revokePermission(grantId, revoker);
            res.json({
                success: true,
                message: 'Permission revoked successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async addPolicyRule(req, res) {
        try {
            const rule = req.body;
            await this.permissionService.addPolicyRule(rule);
            res.status(201).json({
                success: true,
                message: 'Policy rule added successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async removePolicyRule(req, res) {
        try {
            const { ruleId } = req.params;
            await this.permissionService.removePolicyRule(ruleId);
            res.json({
                success: true,
                message: 'Policy rule removed successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async listPolicyRules(req, res) {
        try {
            const rules = await this.permissionService.listPolicyRules();
            res.json({
                success: true,
                data: rules,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}

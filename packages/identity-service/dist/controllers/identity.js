export class IdentityController {
    identityService;
    constructor(identityService) {
        this.identityService = identityService;
    }
    async register(req, res) {
        try {
            const request = req.body;
            const result = await this.identityService.registerDID(request);
            res.status(201).json({
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
    async resolve(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getDocument(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async rotateKeys(req, res) {
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
            const dids = await this.identityService.listDIDs();
            res.json({
                success: true,
                data: dids,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async updateTrustLevel(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getTrustLevelInfo(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}

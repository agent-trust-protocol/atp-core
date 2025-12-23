export class CredentialController {
    credentialService;
    constructor(credentialService) {
        this.credentialService = credentialService;
    }
    async issue(req, res) {
        try {
            const request = req.body;
            const credential = await this.credentialService.issueCredential(request);
            res.status(201).json({
                success: true,
                data: credential,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async verify(req, res) {
        try {
            const request = req.body;
            const result = await this.credentialService.verifyCredential(request);
            res.json({
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
    async revoke(req, res) {
        try {
            const { credentialId } = req.params;
            const { issuerDid } = req.body;
            await this.credentialService.revokeCredential(credentialId, issuerDid);
            res.json({
                success: true,
                message: 'Credential revoked successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async registerSchema(req, res) {
        try {
            const schema = req.body;
            await this.credentialService.registerSchema(schema);
            res.status(201).json({
                success: true,
                message: 'Schema registered successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getSchema(req, res) {
        try {
            const { schemaId } = req.params;
            const schema = await this.credentialService.getSchema(schemaId);
            if (!schema) {
                res.status(404).json({
                    success: false,
                    error: 'Schema not found',
                });
                return;
            }
            res.json({
                success: true,
                data: schema,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async listSchemas(req, res) {
        try {
            const schemas = await this.credentialService.listSchemas();
            res.json({
                success: true,
                data: schemas,
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

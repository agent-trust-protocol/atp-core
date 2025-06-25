import express from 'express';
import cors from 'cors';
import { WebSocketService } from './services/websocket.js';
import { RPCService } from './services/rpc.js';
import { AuthService } from './services/auth.js';
import { MTLSService } from './services/mtls.js';
import { DIDJWTService } from './services/did-jwt.js';
const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;
app.use(cors());
app.use(express.json());
// Initialize mTLS service if TLS config is provided
let mtlsService;
if (process.env.TLS_CONFIG_PATH) {
    try {
        const tlsConfig = MTLSService.loadTLSConfig(process.env.TLS_CONFIG_PATH);
        mtlsService = new MTLSService(tlsConfig);
        console.log('mTLS enabled');
    }
    catch (error) {
        console.warn('mTLS configuration failed, running without mTLS:', error);
    }
}
// Initialize services
const rpcService = new RPCService();
const authService = new AuthService(mtlsService);
const didJWTService = new DIDJWTService();
const wsService = new WebSocketService(rpcService, authService);
// Enhanced authentication middleware
app.use('/secure/*', async (req, res, next) => {
    const authContext = await authService.authenticateRequest(req, req.headers.authorization);
    if (!authContext.authenticated) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }
    // Attach auth context to request for use in handlers
    req.authContext = authContext;
    next();
});
// HTTP API endpoints
app.get('/health', (req, res) => {
    const serviceStatus = rpcService.getServiceStatus();
    res.json({
        status: 'healthy',
        service: 'rpc-gateway',
        version: '0.1.0',
        protocol: 'Agent Trust Protocol™',
        services: serviceStatus,
        mtlsEnabled: !!mtlsService,
        timestamp: Date.now(),
    });
});
app.get('/services', (req, res) => {
    const serviceStatus = rpcService.getServiceStatus();
    res.json({
        success: true,
        data: serviceStatus,
    });
});
// Authentication endpoints
app.post('/auth/challenge', async (req, res) => {
    try {
        const { did } = req.body;
        if (!did) {
            return res.status(400).json({
                success: false,
                error: 'DID is required',
            });
        }
        const challenge = await authService.createAuthChallenge(did);
        res.json({
            success: true,
            challenge,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
app.post('/auth/response', async (req, res) => {
    try {
        const { challenge, response, signature, did } = req.body;
        if (!challenge || !response || !signature || !did) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
        }
        const isValid = await authService.verifyAuthResponse(challenge, response, signature, did);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
            });
        }
        res.json({
            success: true,
            message: 'Authentication successful',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Secure endpoints require authentication
app.get('/secure/status', (req, res) => {
    const authContext = req.authContext;
    res.json({
        success: true,
        message: 'Authenticated access granted',
        authContext: {
            did: authContext.did,
            trustLevel: authContext.trustLevel,
            authMethod: authContext.authMethod,
            capabilities: authContext.capabilities,
        },
    });
});
// Certificate management endpoints (secure)
app.post('/secure/certificates/issue', async (req, res) => {
    try {
        if (!mtlsService) {
            return res.status(503).json({
                success: false,
                error: 'Certificate service not available',
            });
        }
        const { did, publicKey, trustLevel } = req.body;
        const authContext = req.authContext;
        // Verify user has permission to issue certificates
        if (!authContext.capabilities.includes('issue-certificates')) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions to issue certificates',
            });
        }
        const certificate = await mtlsService.issueDIDCertificate(did, publicKey, trustLevel);
        res.json({
            success: true,
            certificate,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Certificate issuance failed',
        });
    }
});
app.post('/secure/certificates/revoke', async (req, res) => {
    try {
        if (!mtlsService) {
            return res.status(503).json({
                success: false,
                error: 'Certificate service not available',
            });
        }
        const { certificateId, reason } = req.body;
        const authContext = req.authContext;
        // Verify user has permission to revoke certificates
        if (!authContext.capabilities.includes('revoke-certificates')) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions to revoke certificates',
            });
        }
        await mtlsService.revokeDIDCertificate(certificateId, reason, authContext.did);
        res.json({
            success: true,
            message: 'Certificate revoked successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Certificate revocation failed',
        });
    }
});
app.get('/secure/certificates/stats', (req, res) => {
    try {
        if (!mtlsService) {
            return res.status(503).json({
                success: false,
                error: 'Certificate service not available',
            });
        }
        const stats = mtlsService.getDIDCAStats();
        res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get certificate stats',
        });
    }
});
app.get('/certificates/ca', (req, res) => {
    try {
        if (!mtlsService) {
            return res.status(503).json({
                success: false,
                error: 'Certificate service not available',
            });
        }
        const caCert = mtlsService.getDIDCACertificate();
        res.json({
            success: true,
            certificate: caCert,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get CA certificate',
        });
    }
});
app.get('/certificates/crl', (req, res) => {
    try {
        if (!mtlsService) {
            return res.status(503).json({
                success: false,
                error: 'Certificate service not available',
            });
        }
        const crl = mtlsService.getRevocationList();
        res.json({
            success: true,
            revocationList: crl,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get revocation list',
        });
    }
});
// Broadcast endpoint for service notifications
app.post('/broadcast', (req, res) => {
    const { event, data } = req.body;
    wsService.broadcast(event, data);
    res.json({ success: true, message: 'Event broadcasted' });
});
// Start health check interval
setInterval(() => {
    rpcService.healthCheck();
}, 30000); // Every 30 seconds
// Start HTTP server
app.listen(port, () => {
    console.log(`Agent Trust Protocol™ - RPC Gateway v0.1.0`);
    console.log(`HTTP server running on port ${port}`);
    console.log(`WebSocket server running on port ${process.env.WS_PORT || '8081'}`);
});
// Start HTTPS server with mTLS if configured
if (mtlsService) {
    const httpsServer = mtlsService.createHTTPSServer(app);
    httpsServer.listen(httpsPort, () => {
        console.log(`HTTPS server with mTLS running on port ${httpsPort}`);
    });
}
export { WebSocketService, RPCService, AuthService, MTLSService, DIDJWTService };

export class RPCService {
    services = new Map();
    constructor() {
        // Register default ATP services
        this.registerService({
            name: 'identity',
            endpoint: 'http://localhost:3001',
            methods: ['identity.register', 'identity.resolve', 'identity.rotateKeys'],
            description: 'Identity management service',
        });
        this.registerService({
            name: 'vc',
            endpoint: 'http://localhost:3002',
            methods: ['vc.issue', 'vc.verify', 'vc.revoke'],
            description: 'Verifiable Credentials service',
        });
        this.registerService({
            name: 'permission',
            endpoint: 'http://localhost:3003',
            methods: ['perm.grant', 'perm.check', 'perm.revoke'],
            description: 'Permission management service',
        });
        this.registerService({
            name: 'audit',
            endpoint: 'http://localhost:3005',
            methods: ['audit.log', 'audit.query', 'audit.verify'],
            description: 'Audit Logger service',
        });
    }
    registerService(config) {
        const service = {
            name: config.name,
            endpoint: config.endpoint,
            methods: new Set(config.methods),
            healthy: true,
            lastHealthCheck: Date.now(),
        };
        this.services.set(config.name, service);
        console.log(`Registered service: ${config.name} at ${config.endpoint}`);
    }
    async handleRequest(request, clientDid) {
        const [serviceName, methodName] = request.method.split('.', 2);
        const startTime = Date.now();
        // Log the RPC request to audit service
        await this.logAuditEvent({
            source: 'rpc-gateway',
            action: 'rpc-request',
            resource: request.method,
            actor: clientDid,
            details: {
                requestId: request.id,
                method: request.method,
                params: request.params,
                timestamp: startTime,
            },
        });
        if (!serviceName || !methodName) {
            const errorResponse = {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Method not found',
                    data: `Invalid method format: ${request.method}`,
                },
                id: request.id,
            };
            await this.logAuditEvent({
                source: 'rpc-gateway',
                action: 'rpc-error',
                resource: request.method,
                actor: clientDid,
                details: {
                    requestId: request.id,
                    error: errorResponse.error,
                    duration: Date.now() - startTime,
                },
            });
            return errorResponse;
        }
        const service = this.services.get(serviceName);
        if (!service) {
            const errorResponse = {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Service not found',
                    data: `Unknown service: ${serviceName}`,
                },
                id: request.id,
            };
            await this.logAuditEvent({
                source: 'rpc-gateway',
                action: 'rpc-error',
                resource: request.method,
                actor: clientDid,
                details: {
                    requestId: request.id,
                    error: errorResponse.error,
                    duration: Date.now() - startTime,
                },
            });
            return errorResponse;
        }
        if (!service.methods.has(request.method)) {
            const errorResponse = {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Method not found',
                    data: `Method ${request.method} not available in service ${serviceName}`,
                },
                id: request.id,
            };
            await this.logAuditEvent({
                source: 'rpc-gateway',
                action: 'rpc-error',
                resource: request.method,
                actor: clientDid,
                details: {
                    requestId: request.id,
                    error: errorResponse.error,
                    duration: Date.now() - startTime,
                },
            });
            return errorResponse;
        }
        try {
            const response = await this.proxyRequest(service, request, clientDid);
            // Log successful response
            await this.logAuditEvent({
                source: 'rpc-gateway',
                action: 'rpc-response',
                resource: request.method,
                actor: clientDid,
                details: {
                    requestId: request.id,
                    success: !response.error,
                    duration: Date.now() - startTime,
                    responseSize: JSON.stringify(response).length,
                },
            });
            return response;
        }
        catch (error) {
            const errorResponse = {
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error instanceof Error ? error.message : 'Unknown error',
                },
                id: request.id,
            };
            await this.logAuditEvent({
                source: 'rpc-gateway',
                action: 'rpc-error',
                resource: request.method,
                actor: clientDid,
                details: {
                    requestId: request.id,
                    error: errorResponse.error,
                    duration: Date.now() - startTime,
                    exception: error instanceof Error ? error.message : String(error),
                },
            });
            return errorResponse;
        }
    }
    async proxyRequest(service, request, clientDid) {
        const [serviceName, methodName] = request.method.split('.', 2);
        // Map RPC methods to HTTP endpoints
        const httpMethod = this.getHttpMethod(methodName);
        const endpoint = this.getServiceEndpoint(serviceName, methodName);
        const url = `${service.endpoint}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: httpMethod,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-DID': clientDid,
                },
                body: httpMethod !== 'GET' ? JSON.stringify(request.params || {}) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    jsonrpc: '2.0',
                    error: {
                        code: response.status === 404 ? -32601 : -32603,
                        message: data.error || 'Service error',
                        data: data,
                    },
                    id: request.id,
                };
            }
            return {
                jsonrpc: '2.0',
                result: data,
                id: request.id,
            };
        }
        catch (error) {
            service.healthy = false;
            throw error;
        }
    }
    getHttpMethod(methodName) {
        const methodMap = {
            'register': 'POST',
            'issue': 'POST',
            'grant': 'POST',
            'verify': 'POST',
            'check': 'POST',
            'resolve': 'GET',
            'list': 'GET',
            'revoke': 'DELETE',
            'rotateKeys': 'POST',
        };
        return methodMap[methodName] || 'POST';
    }
    getServiceEndpoint(serviceName, methodName) {
        const endpointMap = {
            'identity': {
                'register': '/identity/register',
                'resolve': '/identity', // Will append DID as param
                'rotateKeys': '/identity', // Will append DID and action
                'list': '/identity',
            },
            'vc': {
                'issue': '/vc/issue',
                'verify': '/vc/verify',
                'revoke': '/vc/revoke',
                'schemas': '/vc/schemas',
            },
            'permission': {
                'grant': '/perm/grant',
                'check': '/perm/check',
                'revoke': '/perm/revoke',
                'list': '/perm/list',
            },
            'audit': {
                'log': '/audit/log',
                'query': '/audit/events',
                'verify': '/audit/integrity',
                'stats': '/audit/stats',
            },
        };
        return endpointMap[serviceName]?.[methodName] || `/${serviceName}/${methodName}`;
    }
    async healthCheck() {
        for (const [name, service] of this.services.entries()) {
            try {
                const response = await fetch(`${service.endpoint}/health`, {
                    method: 'GET',
                });
                service.healthy = response.ok;
                service.lastHealthCheck = Date.now();
                if (!response.ok) {
                    console.warn(`Service ${name} health check failed`);
                }
            }
            catch (error) {
                service.healthy = false;
                service.lastHealthCheck = Date.now();
                console.error(`Service ${name} health check error:`, error);
            }
        }
    }
    getServiceStatus() {
        const status = {};
        for (const [name, service] of this.services.entries()) {
            status[name] = {
                healthy: service.healthy,
                lastCheck: service.lastHealthCheck,
            };
        }
        return status;
    }
    async logAuditEvent(event) {
        try {
            // Don't log audit events for the audit service itself to avoid recursion
            if (event.resource.startsWith('audit.')) {
                return;
            }
            const auditService = this.services.get('audit');
            if (!auditService || !auditService.healthy) {
                console.warn('Audit service not available, skipping audit log');
                return;
            }
            await fetch(`${auditService.endpoint}/audit/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
        }
        catch (error) {
            console.warn('Failed to log audit event:', error);
            // Don't throw error to avoid disrupting main functionality
        }
    }
}

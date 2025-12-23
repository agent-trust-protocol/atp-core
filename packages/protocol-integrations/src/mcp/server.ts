import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import {
  MCPRequest,
  MCPResponse,
  MCPNotification,
  ATPMCPTool,
  ATPMCPServerConfig,
  MCPAuthContext,
  MCPErrorCode,
} from '../types/mcp.js';
import { TrustLevel, TrustLevelManager } from '@atp/shared';

export class ATPMCPServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private tools: Map<string, ATPMCPTool> = new Map();
  private config: ATPMCPServerConfig;
  private clients: Map<WebSocket, MCPAuthContext> = new Map();

  constructor(config: ATPMCPServerConfig) {
    this.config = config;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress(): void {
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'atp-mcp-server',
        version: this.config.version,
        protocol: 'Agent Trust Protocol™',
        mcp: 'Model Context Protocol',
        tools: this.tools.size,
        clients: this.clients.size,
      });
    });

    // Tool registration endpoint (for dynamic tool addition)
    this.app.post('/tools/register', async (req, res) => {
      try {
        // TODO: Add authentication for tool registration
        const tool = req.body as ATPMCPTool;
        this.registerTool(tool);
        
        // Notify all clients about tool list change
        this.broadcast({
          jsonrpc: '2.0',
          method: 'tools/list_changed',
        });

        res.json({ success: true, message: 'Tool registered successfully' });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New MCP client connection');

      // Extract ATP™ authentication headers
      const authContext = this.extractAuthContext(request.headers);
      
      if (!authContext) {
        ws.close(1008, 'Authentication required');
        return;
      }

      this.clients.set(ws, authContext);

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message, authContext);
        } catch (error) {
          console.error('Error handling MCP message:', error);
          this.sendError(ws, null, MCPErrorCode.PARSE_ERROR, 'Parse error');
        }
      });

      ws.on('close', () => {
        console.log('MCP client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('MCP WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private extractAuthContext(headers: any): MCPAuthContext | null {
    const clientDID = headers['x-atp-did'];
    const trustLevel = headers['x-atp-trust-level'];
    const authMethod = headers['x-atp-auth-method'];
    const sessionId = headers['x-atp-session-id'];

    if (!clientDID || !trustLevel || !authMethod || !sessionId) {
      return null;
    }

    // TODO: Validate authentication with ATP™ gateway
    // For now, trust the headers (in production, validate with identity service)

    return {
      clientDID,
      trustLevel,
      capabilities: this.getCapabilitiesForTrustLevel(trustLevel),
      authenticated: true,
      authMethod: authMethod as any,
      sessionId,
    };
  }

  private getCapabilitiesForTrustLevel(trustLevel: string): string[] {
    // TODO: Get capabilities from ATP™ identity service
    // For now, return default capabilities based on trust level
    const level = trustLevel as TrustLevel;
    return TrustLevelManager.hasCapability(level, 'basic-operations') 
      ? ['basic-operations', 'read-public'] 
      : ['read-public'];
  }

  private async handleMessage(
    ws: WebSocket,
    message: any,
    authContext: MCPAuthContext
  ): Promise<void> {
    if (message.method) {
      // Handle requests
      await this.handleRequest(ws, message as MCPRequest, authContext);
    }
  }

  private async handleRequest(
    ws: WebSocket,
    request: MCPRequest,
    authContext: MCPAuthContext
  ): Promise<void> {
    try {
      let result: any;

      switch (request.method) {
        case 'initialize':
          result = await this.handleInitialize(request.params, authContext);
          break;
        case 'tools/list':
          result = await this.handleToolsList(authContext);
          break;
        case 'tools/call':
          result = await this.handleToolCall(request.params, authContext);
          break;
        default:
          this.sendError(ws, request.id, MCPErrorCode.METHOD_NOT_FOUND, `Method ${request.method} not found`);
          return;
      }

      this.sendResponse(ws, request.id, result);
    } catch (error) {
      console.error('Error handling request:', error);
      this.sendError(
        ws,
        request.id,
        MCPErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  private async handleInitialize(params: any, authContext: MCPAuthContext): Promise<any> {
    // Log client initialization
    await this.logAuditEvent(authContext, 'mcp-client-initialized', {
      clientInfo: params.clientInfo,
      capabilities: params.capabilities,
      protocolVersion: params.protocolVersion,
    });

    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
        logging: { level: 'info' },
      },
      serverInfo: {
        name: this.config.name,
        version: this.config.version,
        description: this.config.description,
        protocol: 'Agent Trust Protocol™',
      },
      atpInfo: {
        serverDID: this.config.atpConfig.serverDID,
        supportedAuthMethods: this.config.atpConfig.supportedAuthMethods,
        trustLevelRequired: this.config.atpConfig.trustLevel,
      },
    };
  }

  private async handleToolsList(authContext: MCPAuthContext): Promise<any> {
    // Filter tools based on client's trust level and capabilities
    const availableTools = Array.from(this.tools.values()).filter(tool => {
      // Check trust level
      if (tool.trustLevelRequired) {
        const userLevel = authContext.trustLevel as TrustLevel;
        const requiredLevel = tool.trustLevelRequired as TrustLevel;
        if (!TrustLevelManager.isAuthorized(userLevel, requiredLevel)) {
          return false;
        }
      }

      // Check capabilities
      if (tool.capabilities && tool.capabilities.length > 0) {
        return tool.capabilities.every(cap => authContext.capabilities.includes(cap));
      }

      return true;
    });

    await this.logAuditEvent(authContext, 'mcp-tools-listed', {
      totalTools: this.tools.size,
      availableTools: availableTools.length,
      filteredTools: availableTools.map(t => t.name),
    });

    return {
      tools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        atpConfig: {
          trustLevelRequired: tool.trustLevelRequired,
          capabilities: tool.capabilities,
          auditRequired: tool.auditRequired,
          rateLimits: tool.rateLimits,
        },
      })),
    };
  }

  private async handleToolCall(params: any, authContext: MCPAuthContext): Promise<any> {
    const { name, arguments: args, atpContext } = params;
    
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Perform ATP™ security checks
    await this.performSecurityChecks(tool, authContext);

    // Log tool execution start
    await this.logAuditEvent(authContext, 'mcp-tool-execution-start', {
      toolName: name,
      arguments: args,
      requestId: atpContext?.requestId,
    });

    const startTime = Date.now();

    try {
      // Execute the tool (this would be implemented by the specific tool)
      // For now, return a placeholder response
      const result = await this.executeTool(tool, args, authContext);

      // Log successful execution
      await this.logAuditEvent(authContext, 'mcp-tool-execution-success', {
        toolName: name,
        duration: Date.now() - startTime,
        requestId: atpContext?.requestId,
        resultSize: JSON.stringify(result).length,
      });

      return result;
    } catch (error) {
      // Log failed execution
      await this.logAuditEvent(authContext, 'mcp-tool-execution-error', {
        toolName: name,
        duration: Date.now() - startTime,
        requestId: atpContext?.requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  private async performSecurityChecks(tool: ATPMCPTool, auth: MCPAuthContext): Promise<void> {
    // Check trust level requirement
    if (tool.trustLevelRequired) {
      const userLevel = auth.trustLevel as TrustLevel;
      const requiredLevel = tool.trustLevelRequired as TrustLevel;
      
      if (!TrustLevelManager.isAuthorized(userLevel, requiredLevel)) {
        throw new Error(`Insufficient trust level. Required: ${requiredLevel}, Current: ${userLevel}`);
      }
    }

    // Check capability requirements
    if (tool.capabilities && tool.capabilities.length > 0) {
      const hasRequiredCapabilities = tool.capabilities.every(cap => 
        auth.capabilities.includes(cap)
      );
      
      if (!hasRequiredCapabilities) {
        const missing = tool.capabilities.filter(cap => !auth.capabilities.includes(cap));
        throw new Error(`Missing required capabilities: ${missing.join(', ')}`);
      }
    }
  }

  private async executeTool(tool: ATPMCPTool, args: any, authContext: MCPAuthContext): Promise<any> {
    // This is where the actual tool execution would happen
    // Implementation depends on the specific tool type
    
    // For demo purposes, return a mock response
    return {
      success: true,
      message: `Tool ${tool.name} executed successfully`,
      timestamp: new Date().toISOString(),
      executedBy: authContext.clientDID,
      trustLevel: authContext.trustLevel,
      arguments: args,
    };
  }

  private sendResponse(ws: WebSocket, id: string | number, result: any): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      result,
      id,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(ws: WebSocket, id: string | number | null, code: number, message: string, data?: any): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      error: { code, message, data },
      id: id || 0,
    };
    ws.send(JSON.stringify(response));
  }

  private broadcast(notification: MCPNotification): void {
    const message = JSON.stringify(notification);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private async logAuditEvent(
    authContext: MCPAuthContext,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('http://localhost:3005/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'mcp-server',
          action,
          resource: 'mcp-protocol',
          actor: authContext.clientDID,
          details: {
            trustLevel: authContext.trustLevel,
            authMethod: authContext.authMethod,
            sessionId: authContext.sessionId,
            ...details,
          },
        }),
      });
    } catch (error) {
      console.warn('Failed to log MCP audit event:', error);
    }
  }

  public registerTool(tool: ATPMCPTool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered ATP™ MCP tool: ${tool.name} (Trust Level: ${tool.trustLevelRequired || 'None'})`);
  }

  public start(port: number = 3006): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`ATP™ MCP Server running on port ${port}`);
        console.log(`WebSocket endpoint: ws://localhost:${port}`);
        console.log(`HTTP endpoint: http://localhost:${port}`);
        console.log(`Server DID: ${this.config.atpConfig.serverDID}`);
        resolve();
      });
    });
  }

  public stop(): void {
    this.wss.close();
    this.server.close();
  }
}
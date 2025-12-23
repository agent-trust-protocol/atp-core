import { EventEmitter } from 'events';
import WebSocket from 'ws';
import {
  MCPRequest,
  MCPResponse,
  MCPNotification,
  ATPMCPTool,
  ATPMCPServerConfig,
  MCPAuthContext,
  MCPToolContext,
  MCPErrorCode,
} from '../types/mcp.js';
import { TrustLevel, TrustLevelManager } from '@atp/shared';

export class ATPMCPAdapter extends EventEmitter {
  private ws?: WebSocket;
  private tools: Map<string, ATPMCPTool> = new Map();
  private authContext?: MCPAuthContext;
  private config: ATPMCPServerConfig;
  private requestCounter = 0;

  constructor(config: ATPMCPServerConfig) {
    super();
    this.config = config;
  }

  async connect(url: string, authContext: MCPAuthContext): Promise<void> {
    this.authContext = authContext;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: {
          'X-ATP-DID': authContext.clientDID,
          'X-ATP-Trust-Level': authContext.trustLevel,
          'X-ATP-Auth-Method': authContext.authMethod,
          'X-ATP-Session-ID': authContext.sessionId,
        },
      });

      this.ws.on('open', () => {
        console.log(`ATP™ MCP Adapter connected to ${url}`);
        this.initializeConnection();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        console.error('ATP™ MCP Adapter WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('ATP™ MCP Adapter disconnected');
        this.emit('disconnected');
      });
    });
  }

  private async initializeConnection(): Promise<void> {
    // Send ATP™ enhanced MCP initialization
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: { listChanged: true },
        logging: { level: 'info' },
      },
      clientInfo: {
        name: 'ATP™ MCP Adapter',
        version: '0.1.0',
        protocol: 'Agent Trust Protocol™',
      },
      atpInfo: {
        clientDID: this.authContext?.clientDID,
        trustLevel: this.authContext?.trustLevel,
        capabilities: this.authContext?.capabilities,
        auditRequired: true,
      },
    });

    // Request tool list with ATP™ security context
    await this.refreshTools();
  }

  async refreshTools(): Promise<void> {
    try {
      const response = await this.sendRequest('tools/list', {});
      
      if (response.result?.tools) {
        this.tools.clear();
        
        for (const tool of response.result.tools) {
          // Enhance standard MCP tools with ATP™ security metadata
          const atpTool: ATPMCPTool = {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            trustLevelRequired: tool.atpConfig?.trustLevelRequired || TrustLevel.BASIC,
            capabilities: tool.atpConfig?.capabilities || ['basic-operations'],
            auditRequired: tool.atpConfig?.auditRequired ?? true,
            rateLimits: tool.atpConfig?.rateLimits,
          };
          
          this.tools.set(tool.name, atpTool);
        }
        
        console.log(`Loaded ${this.tools.size} ATP™ enhanced MCP tools`);
        this.emit('toolsUpdated', Array.from(this.tools.values()));
      }
    } catch (error) {
      console.error('Failed to refresh MCP tools:', error);
    }
  }

  async callTool(toolName: string, arguments_: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    if (!this.authContext) {
      throw new Error('No authentication context available');
    }

    // ATP™ Security Checks
    await this.performSecurityChecks(tool, this.authContext);

    const requestId = ++this.requestCounter;
    const context: MCPToolContext = {
      auth: this.authContext,
      tool,
      requestId,
      startTime: Date.now(),
      auditRequired: tool.auditRequired,
    };

    // Log tool execution start
    if (context.auditRequired) {
      await this.logAuditEvent(context, 'tool-execution-start', {
        toolName,
        arguments: arguments_,
      });
    }

    try {
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: arguments_,
        atpContext: {
          requestId,
          clientDID: this.authContext.clientDID,
          trustLevel: this.authContext.trustLevel,
          auditRequired: tool.auditRequired,
        },
      });

      // Log successful execution
      if (context.auditRequired) {
        await this.logAuditEvent(context, 'tool-execution-success', {
          duration: Date.now() - context.startTime,
          resultSize: JSON.stringify(response.result).length,
        });
      }

      return response.result;
    } catch (error) {
      // Log failed execution
      if (context.auditRequired) {
        await this.logAuditEvent(context, 'tool-execution-error', {
          duration: Date.now() - context.startTime,
          error: error instanceof Error ? error.message : String(error),
        });
      }
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

    // Check rate limits (placeholder - implement actual rate limiting)
    if (tool.rateLimits) {
      // TODO: Implement rate limiting logic
      console.log('Rate limiting check (TODO):', tool.rateLimits);
    }
  }

  private async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.requestCounter;
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method,
        params,
        id,
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for method ${method}`));
      }, 30000);

      const responseHandler = (message: string) => {
        try {
          const response = JSON.parse(message) as MCPResponse;
          if (response.id === id) {
            clearTimeout(timeout);
            this.ws?.removeListener('message', responseHandler);
            
            if (response.error) {
              reject(new Error(`MCP Error ${response.error.code}: ${response.error.message}`));
            } else {
              resolve(response);
            }
          }
        } catch (error) {
          // Not our response, ignore
        }
      };

      this.ws.on('message', responseHandler);
      this.ws.send(JSON.stringify(request));
    });
  }

  private handleMessage(message: string): void {
    try {
      const data = JSON.parse(message);
      
      // Handle notifications
      if (!data.id && data.method) {
        this.handleNotification(data as MCPNotification);
      }
      
      // Responses are handled by sendRequest
    } catch (error) {
      console.error('Failed to parse MCP message:', error);
    }
  }

  private handleNotification(notification: MCPNotification): void {
    switch (notification.method) {
      case 'tools/list_changed':
        this.refreshTools();
        break;
      case 'resources/list_changed':
        this.emit('resourcesUpdated');
        break;
      case 'prompts/list_changed':
        this.emit('promptsUpdated');
        break;
      default:
        this.emit('notification', notification);
    }
  }

  private async logAuditEvent(
    context: MCPToolContext,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      // Log to ATP™ audit service
      await fetch('http://localhost:3005/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'mcp-adapter',
          action,
          resource: `mcp-tool:${context.tool.name}`,
          actor: context.auth.clientDID,
          details: {
            requestId: context.requestId,
            toolName: context.tool.name,
            trustLevel: context.auth.trustLevel,
            authMethod: context.auth.authMethod,
            ...details,
          },
        }),
      });
    } catch (error) {
      console.warn('Failed to log MCP audit event:', error);
    }
  }

  getAvailableTools(): ATPMCPTool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ATPMCPTool | undefined {
    return this.tools.get(name);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
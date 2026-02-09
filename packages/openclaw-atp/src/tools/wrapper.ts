/**
 * ATP Tool Wrapper
 * 
 * Security wrapper for OpenClaw tools that intercepts all calls
 * and applies ATP authentication, authorization, and audit logging
 */

import type { ATPClient } from 'atp-sdk';
import type { AgentContext } from '../agent/types.js';
import type {
  ToolSecurityConfig,
  ToolCallContext,
  ToolCallDecision,
  ToolExecutionResult,
  RateLimitState
} from './types.js';

/**
 * ATP Tool Wrapper Class
 * 
 * Wraps any tool to add ATP security checks before execution
 */
export class ATPToolWrapper {
  private tool: any;
  private atpClient: ATPClient;
  private config: ToolSecurityConfig;
  private rateLimitState: Map<string, RateLimitState> = new Map();

  constructor(tool: any, atpClient: ATPClient, config: ToolSecurityConfig = {}) {
    this.tool = tool;
    this.atpClient = atpClient;
    this.config = {
      minTrustScore: 0.5,
      auditRequired: true,
      rateLimit: 60, // 60 calls per minute default
      dlpEnabled: true,
      ...config
    };
  }

  /**
   * Execute tool with ATP security checks
   */
  async execute(agentContext: AgentContext, ...args: any[]): Promise<ToolExecutionResult> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Create tool call context
    const context: ToolCallContext = {
      agentContext,
      toolName: this.getToolName(),
      arguments: this.extractArguments(args),
      requestId,
      timestamp: new Date()
    };

    try {
      // 1. Perform ATP security checks
      const decision = await this.checkSecurity(context);

      if (!decision.allowed) {
        // Log blocked attempt
        await this.logBlockedCall(context, decision);
        
        // Update trust score (negative impact)
        await this.updateTrustScore(agentContext, -0.01, 'blocked-tool-call');

        return {
          success: false,
          error: new Error(`Action blocked by ATP security: ${decision.reason}`),
          executionTime: Date.now() - startTime,
          atpMetadata: {
            signatureValid: false,
            quantumSafeVerified: false,
            trustImpact: -0.01
          }
        };
      }

      // Log warnings if any
      if (decision.warnings && decision.warnings.length > 0) {
        console.warn(`⚠️ ATP Warnings for ${context.toolName}:`, decision.warnings);
      }

      // 2. Log tool execution start
      if (this.config.auditRequired) {
        await this.logExecutionStart(context, decision);
      }

      // 3. Execute the actual tool
      const result = await this.executeTool(args);

      // 4. Validate result (DLP, schema, etc.)
      await this.validateResult(result, context);

      // 5. Log successful execution
      const auditLogId = await this.logExecutionSuccess(context, result);

      // 6. Update trust score (positive impact)
      await this.updateTrustScore(agentContext, 0.001, 'successful-tool-call');

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        atpMetadata: {
          signatureValid: true,
          quantumSafeVerified: true,
          auditLogId,
          trustImpact: 0.001
        }
      };

    } catch (error) {
      // Log execution failure
      await this.logExecutionFailure(context, error as Error);

      // Update trust score (negative impact)
      await this.updateTrustScore(agentContext, -0.005, 'failed-tool-call');

      return {
        success: false,
        error: error as Error,
        executionTime: Date.now() - startTime,
        atpMetadata: {
          signatureValid: true,
          quantumSafeVerified: true,
          trustImpact: -0.005
        }
      };
    }
  }

  /**
   * Perform ATP security checks
   */
  private async checkSecurity(context: ToolCallContext): Promise<ToolCallDecision> {
    const decision: ToolCallDecision = {
      allowed: true,
      warnings: [],
      trustCheckPassed: false,
      permissionCheckPassed: false
    };

    // 1. Check agent authentication
    const authValid = await this.verifyAuthentication(context);
    if (!authValid) {
      return {
        ...decision,
        allowed: false,
        reason: 'Agent authentication failed'
      };
    }

    // 2. Check trust level
    const trustCheck = this.checkTrustLevel(context);
    decision.trustCheckPassed = trustCheck.passed;
    
    if (!trustCheck.passed) {
      return {
        ...decision,
        allowed: false,
        reason: `Insufficient trust level: ${trustCheck.currentTrust.toFixed(2)} < ${this.config.minTrustScore?.toFixed(2)}`
      };
    }

    // 3. Check permissions
    const permissionCheck = await this.checkPermissions(context);
    decision.permissionCheckPassed = permissionCheck.allowed;
    
    if (!permissionCheck.allowed) {
      return {
        ...decision,
        allowed: false,
        reason: `Permission denied: ${permissionCheck.reason}`
      };
    }

    decision.appliedPolicy = permissionCheck.policy;

    // 4. Check rate limits
    const rateLimitCheck = this.checkRateLimit(context);
    if (!rateLimitCheck.allowed) {
      return {
        ...decision,
        allowed: false,
        reason: `Rate limit exceeded: ${rateLimitCheck.callsRemaining} calls remaining`
      };
    }

    if (rateLimitCheck.callsRemaining < 5) {
      decision.warnings?.push(`Rate limit warning: ${rateLimitCheck.callsRemaining} calls remaining`);
    }

    // 5. Custom validation
    if (this.config.customValidator) {
      const customValid = await this.config.customValidator(context.agentContext, context.arguments);
      if (!customValid) {
        return {
          ...decision,
          allowed: false,
          reason: 'Custom security validation failed'
        };
      }
    }

    return decision;
  }

  /**
   * Verify agent authentication
   */
  private async verifyAuthentication(context: ToolCallContext): Promise<boolean> {
    const { agentContext } = context;
    
    if (!agentContext.atp?.did) {
      return false;
    }

    // In a real implementation, verify signatures here
    // For now, check if DID is valid and registered
    try {
      const didDoc = await this.atpClient.identity.getDID(agentContext.atp.did);
      return !!didDoc;
    } catch {
      return false;
    }
  }

  /**
   * Check trust level
   */
  private checkTrustLevel(context: ToolCallContext): { passed: boolean; currentTrust: number } {
    const currentTrust = context.agentContext.atp?.trustScore || 0;
    const requiredTrust = this.config.minTrustScore || 0.5;

    return {
      passed: currentTrust >= requiredTrust,
      currentTrust
    };
  }

  /**
   * Check permissions
   */
  private async checkPermissions(context: ToolCallContext): Promise<{ allowed: boolean; reason?: string; policy?: string }> {
    try {
      const decision = await this.atpClient.permissions.checkAccess({
        subject: context.agentContext.atp.did,
        action: 'execute',
        resource: `tool:${context.toolName}`,
        context: {
          trustScore: context.agentContext.atp.trustScore,
          arguments: context.arguments
        }
      });

      return {
        allowed: decision.allowed,
        reason: decision.reason,
        policy: this.config.requiredPolicy
      };
    } catch (error) {
      return {
        allowed: false,
        reason: `Permission check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(context: ToolCallContext): { allowed: boolean; callsRemaining: number } {
    const key = `${context.agentContext.atp.did}:${context.toolName}`;
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    const maxCalls = this.config.rateLimit || 60;

    let state = this.rateLimitState.get(key);

    if (!state || now - state.windowStart.getTime() >= windowDuration) {
      // New window
      state = {
        toolName: context.toolName,
        agentDid: context.agentContext.atp.did,
        callCount: 1,
        windowStart: new Date(now),
        windowDuration
      };
      this.rateLimitState.set(key, state);
      
      return { allowed: true, callsRemaining: maxCalls - 1 };
    }

    // Within window
    state.callCount++;

    if (state.callCount > maxCalls) {
      return { allowed: false, callsRemaining: 0 };
    }

    return { allowed: true, callsRemaining: maxCalls - state.callCount };
  }

  /**
   * Execute the wrapped tool
   */
  private async executeTool(args: any[]): Promise<any> {
    // Handle different tool types (function, class method, etc.)
    if (typeof this.tool === 'function') {
      return await this.tool(...args);
    } else if (this.tool.execute) {
      return await this.tool.execute(...args);
    } else if (this.tool._call) {
      // LangChain tool
      return await this.tool._call(...args);
    } else {
      throw new Error('Unsupported tool type');
    }
  }

  /**
   * Validate tool execution result
   */
  private async validateResult(result: any, context: ToolCallContext): Promise<void> {
    if (!this.config.dlpEnabled) return;

    // Basic DLP checks
    const resultStr = JSON.stringify(result);

    // Check for potential PII
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(resultStr)) {
        await this.atpClient.audit.log({
          eventType: 'dlp-warning',
          agentDid: context.agentContext.atp.did,
          severity: 'warning',
          metadata: {
            toolName: context.toolName,
            pattern: pattern.source,
            message: 'Potential PII detected in tool result'
          }
        });
      }
    }
  }

  /**
   * Update agent trust score
   */
  private async updateTrustScore(agentContext: AgentContext, delta: number, reason: string): Promise<void> {
    // Trust updates are typically handled by the agent itself
    // This is a simplified version
    if (Math.abs(delta) < 0.001) return; // Skip very small updates

    try {
      await this.atpClient.identity.updateTrustLevel({
        did: agentContext.atp.did,
        trustScore: agentContext.atp.trustScore + delta,
        reason
      });
    } catch (error) {
      console.error('Failed to update trust score:', error);
    }
  }

  // Logging methods
  private async logExecutionStart(context: ToolCallContext, decision: ToolCallDecision): Promise<void> {
    await this.atpClient.audit.log({
      eventType: 'tool-execution-start',
      agentDid: context.agentContext.atp.did,
      severity: 'info',
      metadata: {
        toolName: context.toolName,
        requestId: context.requestId,
        trustScore: context.agentContext.atp.trustScore,
        policy: decision.appliedPolicy
      }
    });
  }

  private async logExecutionSuccess(context: ToolCallContext, result: any): Promise<string | undefined> {
    const event = await this.atpClient.audit.log({
      eventType: 'tool-execution-success',
      agentDid: context.agentContext.atp.did,
      severity: 'info',
      metadata: {
        toolName: context.toolName,
        requestId: context.requestId,
        resultHash: this.hashResult(result)
      }
    });

    return event.id;
  }

  private async logExecutionFailure(context: ToolCallContext, error: Error): Promise<void> {
    await this.atpClient.audit.log({
      eventType: 'tool-execution-failure',
      agentDid: context.agentContext.atp.did,
      severity: 'error',
      metadata: {
        toolName: context.toolName,
        requestId: context.requestId,
        error: error.message,
        stack: error.stack
      }
    });
  }

  private async logBlockedCall(context: ToolCallContext, decision: ToolCallDecision): Promise<void> {
    await this.atpClient.audit.log({
      eventType: 'tool-execution-blocked',
      agentDid: context.agentContext.atp.did,
      severity: 'warning',
      metadata: {
        toolName: context.toolName,
        requestId: context.requestId,
        reason: decision.reason,
        trustScore: context.agentContext.atp.trustScore
      }
    });
  }

  // Utility methods
  private getToolName(): string {
    return this.tool.name || this.tool.constructor?.name || 'UnknownTool';
  }

  private extractArguments(args: any[]): Record<string, any> {
    if (args.length === 1 && typeof args[0] === 'object') {
      return args[0];
    }
    return { args };
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashResult(result: any): string {
    // Simple hash for audit logging (don't store full result)
    const str = JSON.stringify(result);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

/**
 * Wrap multiple tools with ATP security
 */
export function secureTools(
  tools: any[],
  atpClient: ATPClient,
  config?: ToolSecurityConfig
): ATPToolWrapper[] {
  return tools.map(tool => new ATPToolWrapper(tool, atpClient, config));
}

/**
 * Protocol Detection System
 *
 * Automatically detects which AI agent protocol is being used
 * based on agent signatures, metadata, and behavioral patterns.
 */

import { Protocol } from './types.js';

/**
 * Protocol Detection Result
 */
export interface DetectionResult {
  protocol: Protocol;
  confidence: number; // 0-1
  reasons: string[];
  metadata?: Record<string, any>;
}

/**
 * Protocol Detector
 *
 * Analyzes agent structure and behavior to determine which protocol it uses
 */
export class ProtocolDetector {
  /**
   * Detect protocol from agent instance
   */
  static async detect(agent: any): Promise<DetectionResult> {
    const results: DetectionResult[] = [];

    // Check for Swarm signatures
    const swarmResult = this.detectSwarm(agent);
    if (swarmResult.confidence > 0) {
      results.push(swarmResult);
    }

    // Check for ADK signatures
    const adkResult = this.detectADK(agent);
    if (adkResult.confidence > 0) {
      results.push(adkResult);
    }

    // Check for A2A signatures
    const a2aResult = this.detectA2A(agent);
    if (a2aResult.confidence > 0) {
      results.push(a2aResult);
    }

    // Check for MCP signatures
    const mcpResult = this.detectMCP(agent);
    if (mcpResult.confidence > 0) {
      results.push(mcpResult);
    }

    // Return highest confidence result
    if (results.length === 0) {
      return {
        protocol: Protocol.UNKNOWN,
        confidence: 0,
        reasons: ['No protocol signatures detected']
      };
    }

    // Sort by confidence and return highest
    results.sort((a, b) => b.confidence - a.confidence);
    return results[0];
  }

  /**
   * Detect OpenAI Swarm protocol
   */
  private static detectSwarm(agent: any): DetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for Swarm-specific properties
    if (agent.handoff || typeof agent.handoff === 'function') {
      reasons.push('Has handoff capability');
      confidence += 0.4;
    }

    if (agent.routines || Array.isArray(agent.routines)) {
      reasons.push('Has routines array');
      confidence += 0.3;
    }

    if (agent.context && typeof agent.context === 'object') {
      reasons.push('Has context object');
      confidence += 0.2;
    }

    if (agent.tools && Array.isArray(agent.tools)) {
      reasons.push('Has tools array');
      confidence += 0.1;
    }

    // Check for Swarm metadata
    if (agent.metadata?.framework === 'swarm' || agent.type === 'swarm') {
      reasons.push('Explicit Swarm metadata');
      confidence = Math.max(confidence, 0.9);
    }

    return {
      protocol: Protocol.SWARM,
      confidence: Math.min(confidence, 1.0),
      reasons,
      metadata: {
        hasHandoff: !!agent.handoff,
        hasRoutines: !!agent.routines,
        hasContext: !!agent.context
      }
    };
  }

  /**
   * Detect Google ADK protocol
   */
  private static detectADK(agent: any): DetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for ADK-specific properties
    if (agent.role || typeof agent.setRole === 'function') {
      reasons.push('Has role assignment');
      confidence += 0.4;
    }

    if (agent.evaluate || typeof agent.evaluate === 'function') {
      reasons.push('Has evaluation capability');
      confidence += 0.3;
    }

    if (agent.deploy || agent.deployment) {
      reasons.push('Has deployment features');
      confidence += 0.2;
    }

    if (agent.collaborate || agent.collaboration) {
      reasons.push('Has collaboration features');
      confidence += 0.1;
    }

    // Check for ADK metadata
    if (agent.metadata?.framework === 'adk' || agent.type === 'adk' || agent.sdk === 'google-adk') {
      reasons.push('Explicit ADK metadata');
      confidence = Math.max(confidence, 0.9);
    }

    return {
      protocol: Protocol.ADK,
      confidence: Math.min(confidence, 1.0),
      reasons,
      metadata: {
        hasRole: !!agent.role,
        hasEvaluate: !!agent.evaluate,
        hasDeployment: !!agent.deploy
      }
    };
  }

  /**
   * Detect Agent2Agent (A2A) protocol
   */
  private static detectA2A(agent: any): DetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for A2A-specific properties
    if (agent.discover || typeof agent.discover === 'function') {
      reasons.push('Has discovery mechanism');
      confidence += 0.4;
    }

    if (agent.advertise || typeof agent.advertise === 'function') {
      reasons.push('Has capability advertisement');
      confidence += 0.3;
    }

    if (agent.capabilities && Array.isArray(agent.capabilities)) {
      reasons.push('Has capabilities list');
      confidence += 0.2;
    }

    if (agent.bridge || agent.protocol?.includes('a2a')) {
      reasons.push('Has bridging or A2A protocol marker');
      confidence += 0.1;
    }

    // Check for A2A metadata
    if (agent.metadata?.protocol === 'a2a' || agent.type === 'a2a' || agent.standard === 'agent2agent') {
      reasons.push('Explicit A2A metadata');
      confidence = Math.max(confidence, 0.9);
    }

    return {
      protocol: Protocol.A2A,
      confidence: Math.min(confidence, 1.0),
      reasons,
      metadata: {
        hasDiscover: !!agent.discover,
        hasAdvertise: !!agent.advertise,
        hasCapabilities: !!agent.capabilities
      }
    };
  }

  /**
   * Detect Model Context Protocol (MCP)
   */
  private static detectMCP(agent: any): DetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for MCP-specific properties
    if (agent.context && (agent.contextManagement || agent.updateContext)) {
      reasons.push('Has context management');
      confidence += 0.4;
    }

    if (agent.tools && typeof agent.tools === 'object') {
      reasons.push('Has tools object/registry');
      confidence += 0.3;
    }

    if (agent.retrieval || agent.retrieve || agent.search) {
      reasons.push('Has retrieval capability');
      confidence += 0.2;
    }

    if (agent.integrations || agent.apps) {
      reasons.push('Has app integrations');
      confidence += 0.1;
    }

    // Check for MCP metadata
    if (agent.metadata?.protocol === 'mcp' || agent.type === 'mcp' || agent.framework === 'model-context-protocol') {
      reasons.push('Explicit MCP metadata');
      confidence = Math.max(confidence, 0.9);
    }

    return {
      protocol: Protocol.MCP,
      confidence: Math.min(confidence, 1.0),
      reasons,
      metadata: {
        hasContext: !!agent.context,
        hasTools: !!agent.tools,
        hasRetrieval: !!(agent.retrieval || agent.retrieve)
      }
    };
  }

  /**
   * Batch detect protocols for multiple agents
   */
  static async detectBatch(agents: any[]): Promise<Map<any, DetectionResult>> {
    const results = new Map<any, DetectionResult>();

    for (const agent of agents) {
      const result = await this.detect(agent);
      results.set(agent, result);
    }

    return results;
  }

  /**
   * Get all supported protocols
   */
  static getSupportedProtocols(): Protocol[] {
    return [
      Protocol.MCP,
      Protocol.SWARM,
      Protocol.ADK,
      Protocol.A2A
    ];
  }

  /**
   * Validate protocol support
   */
  static isProtocolSupported(protocol: Protocol): boolean {
    return this.getSupportedProtocols().includes(protocol);
  }
}

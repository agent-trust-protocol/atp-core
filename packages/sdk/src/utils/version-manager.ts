/**
 * Version Management System for ATP SDK
 * 
 * Tracks protocol versions, agent versions, and determines when SDK version
 * needs to be updated based on breaking changes in protocols or agents.
 * 
 * ATP serves as the ecosystem security layer for all AI agents.
 */

import { Protocol } from '../protocols/base/types.js';

/**
 * Protocol version information
 */
export interface ProtocolVersion {
  protocol: Protocol;
  version: string;
  sdkVersion: string; // SDK version that introduced this protocol version
  breakingChanges: boolean;
  changes: string[];
  lastUpdated: string;
}

/**
 * Agent version information
 */
export interface AgentVersion {
  agentType: string;
  version: string;
  sdkVersion: string; // SDK version that introduced this agent version
  breakingChanges: boolean;
  changes: string[];
  lastUpdated: string;
}

/**
 * SDK version compatibility matrix
 */
export interface SDKCompatibility {
  sdkVersion: string;
  protocols: Map<Protocol, string>; // Protocol -> version
  agents: Map<string, string>; // Agent type -> version
  breakingChanges: string[];
  releaseDate: string;
}

/**
 * Version change type
 */
export type VersionChangeType = 'major' | 'minor' | 'patch' | 'breaking';

/**
 * Version Manager - Tracks and manages versions across the ATP ecosystem
 */
export class VersionManager {
  private static instance: VersionManager;
  private protocolVersions: Map<Protocol, ProtocolVersion> = new Map();
  private agentVersions: Map<string, AgentVersion> = new Map();
  // SDK compatibility matrix (reserved for future use)
  // private sdkCompatibility: SDKCompatibility[] = [];

  private constructor() {
    this.initializeVersions();
  }

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  /**
   * Initialize current protocol and agent versions
   */
  private initializeVersions(): void {
    const currentSDKVersion = '1.1.0';
    const now = new Date().toISOString();

    // Protocol Versions
    this.protocolVersions.set(Protocol.MCP, {
      protocol: Protocol.MCP,
      version: '2024-11-05',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial MCP support with ATP security layer'],
      lastUpdated: now
    });

    this.protocolVersions.set(Protocol.SWARM, {
      protocol: Protocol.SWARM,
      version: '1.0.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial OpenAI Swarm support'],
      lastUpdated: now
    });

    this.protocolVersions.set(Protocol.ADK, {
      protocol: Protocol.ADK,
      version: '1.0.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial Google ADK support'],
      lastUpdated: now
    });

    this.protocolVersions.set(Protocol.A2A, {
      protocol: Protocol.A2A,
      version: '1.0.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial Agent2Agent Protocol support'],
      lastUpdated: now
    });

    // Agent Versions
    this.agentVersions.set('simple-agent', {
      agentType: 'simple-agent',
      version: '1.1.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Quantum-safe by default', '3-line quick start'],
      lastUpdated: now
    });

    this.agentVersions.set('mcp-agent', {
      agentType: 'mcp-agent',
      version: '1.0.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial MCP agent support'],
      lastUpdated: now
    });

    this.agentVersions.set('enterprise-agent', {
      agentType: 'enterprise-agent',
      version: '1.0.0',
      sdkVersion: currentSDKVersion,
      breakingChanges: false,
      changes: ['Initial enterprise agent support'],
      lastUpdated: now
    });
  }

  /**
   * Get current protocol version
   */
  getProtocolVersion(protocol: Protocol): ProtocolVersion | undefined {
    return this.protocolVersions.get(protocol);
  }

  /**
   * Get current agent version
   */
  getAgentVersion(agentType: string): AgentVersion | undefined {
    return this.agentVersions.get(agentType);
  }

  /**
   * Check if SDK version needs updating based on protocol/agent changes
   */
  checkSDKVersionUpdate(
    protocolChanges?: Map<Protocol, { version: string; breaking: boolean }>,
    agentChanges?: Map<string, { version: string; breaking: boolean }>
  ): {
    needsUpdate: boolean;
    recommendedVersion: string;
    changeType: VersionChangeType;
    reasons: string[];
  } {
    const currentSDKVersion = '1.1.0';
    const [major, minor, patch] = currentSDKVersion.split('.').map(Number);
    const reasons: string[] = [];
    let hasBreakingChanges = false;
    let hasNewFeatures = false;

    // Check protocol changes
    if (protocolChanges) {
      for (const [protocol, change] of protocolChanges) {
        const current = this.protocolVersions.get(protocol);
        if (current) {
          if (change.breaking) {
            hasBreakingChanges = true;
            reasons.push(`Breaking change in ${protocol} protocol (${change.version})`);
          } else if (change.version !== current.version) {
            hasNewFeatures = true;
            reasons.push(`New version of ${protocol} protocol (${change.version})`);
          }
        } else {
          hasNewFeatures = true;
          reasons.push(`New protocol support: ${protocol} (${change.version})`);
        }
      }
    }

    // Check agent changes
    if (agentChanges) {
      for (const [agentType, change] of agentChanges) {
        const current = this.agentVersions.get(agentType);
        if (current) {
          if (change.breaking) {
            hasBreakingChanges = true;
            reasons.push(`Breaking change in ${agentType} agent (${change.version})`);
          } else if (change.version !== current.version) {
            hasNewFeatures = true;
            reasons.push(`New version of ${agentType} agent (${change.version})`);
          }
        } else {
          hasNewFeatures = true;
          reasons.push(`New agent type: ${agentType} (${change.version})`);
        }
      }
    }

    // Determine version bump
    let recommendedVersion: string;
    let changeType: VersionChangeType;

    if (hasBreakingChanges) {
      recommendedVersion = `${major + 1}.0.0`;
      changeType = 'major';
    } else if (hasNewFeatures) {
      recommendedVersion = `${major}.${minor + 1}.0`;
      changeType = 'minor';
    } else {
      recommendedVersion = `${major}.${minor}.${patch + 1}`;
      changeType = 'patch';
    }

    return {
      needsUpdate: hasBreakingChanges || hasNewFeatures,
      recommendedVersion,
      changeType,
      reasons
    };
  }

  /**
   * Update protocol version
   */
  updateProtocolVersion(
    protocol: Protocol,
    version: string,
    breakingChanges: boolean,
    changes: string[]
  ): void {
    const currentSDKVersion = '1.1.0';
    this.protocolVersions.set(protocol, {
      protocol,
      version,
      sdkVersion: currentSDKVersion,
      breakingChanges,
      changes,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Update agent version
   */
  updateAgentVersion(
    agentType: string,
    version: string,
    breakingChanges: boolean,
    changes: string[]
  ): void {
    const currentSDKVersion = '1.1.0';
    this.agentVersions.set(agentType, {
      agentType,
      version,
      sdkVersion: currentSDKVersion,
      breakingChanges,
      changes,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Get all protocol versions
   */
  getAllProtocolVersions(): Map<Protocol, ProtocolVersion> {
    return new Map(this.protocolVersions);
  }

  /**
   * Get all agent versions
   */
  getAllAgentVersions(): Map<string, AgentVersion> {
    return new Map(this.agentVersions);
  }

  /**
   * Generate version report
   */
  generateVersionReport(): {
    sdkVersion: string;
    protocols: Array<{ protocol: string; version: string; breaking: boolean }>;
    agents: Array<{ type: string; version: string; breaking: boolean }>;
    summary: string;
  } {
    const protocols = Array.from(this.protocolVersions.values()).map(p => ({
      protocol: p.protocol,
      version: p.version,
      breaking: p.breakingChanges
    }));

    const agents = Array.from(this.agentVersions.values()).map(a => ({
      type: a.agentType,
      version: a.version,
      breaking: a.breakingChanges
    }));

    const breakingCount = protocols.filter(p => p.breaking).length + 
                         agents.filter(a => a.breaking).length;

    return {
      sdkVersion: '1.1.0',
      protocols,
      agents,
      summary: breakingCount > 0 
        ? `⚠️ ${breakingCount} breaking change(s) detected - SDK version update recommended`
        : '✅ All versions compatible - no breaking changes'
    };
  }

  /**
   * Check compatibility between SDK version and protocol/agent versions
   */
  checkCompatibility(
    sdkVersion: string,
    protocolVersions?: Map<Protocol, string>,
    agentVersions?: Map<string, string>
  ): {
    compatible: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const [sdkMajor] = sdkVersion.split('.').map(Number);

    // Check protocol compatibility
    if (protocolVersions) {
      for (const [protocol] of protocolVersions) {
        const supported = this.protocolVersions.get(protocol);
        if (!supported) {
          issues.push(`Protocol ${protocol} not supported in SDK ${sdkVersion}`);
        } else {
          const [supportedMajor] = supported.sdkVersion.split('.').map(Number);
          if (supportedMajor > sdkMajor) {
            issues.push(`Protocol ${protocol} requires SDK v${supported.sdkVersion} or higher`);
          }
        }
      }
    }

    // Check agent compatibility
    if (agentVersions) {
      for (const [agentType] of agentVersions) {
        const supported = this.agentVersions.get(agentType);
        if (!supported) {
          issues.push(`Agent type ${agentType} not supported in SDK ${sdkVersion}`);
        } else {
          const [supportedMajor] = supported.sdkVersion.split('.').map(Number);
          if (supportedMajor > sdkMajor) {
            issues.push(`Agent ${agentType} requires SDK v${supported.sdkVersion} or higher`);
          }
        }
      }
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }
}

/**
 * Export singleton instance
 */
export const versionManager = VersionManager.getInstance();


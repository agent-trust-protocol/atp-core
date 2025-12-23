/**
 * Protocols Module
 *
 * Multi-protocol support for AI agents with ATP security
 *
 * Supported Protocols:
 * - MCP: Model Context Protocol (Anthropic)
 * - Swarm: OpenAI Swarm (multi-agent orchestration)
 * - ADK: Google Agent Development Kit
 * - A2A: Agent2Agent Protocol (vendor-neutral)
 */

// Base protocol abstractions
export * from './base/index.js';

// Protocol implementations
export * from './mcp/index.js';

// Re-export commonly used types
export type {
  Protocol,
  ProtocolInfo,
  Agent,
  AgentEvent,
  Message,
  SecuredMessage,
  VerificationResult,
  ProtocolAdapterConfig
} from './base/types.js';

export type {
  ProtocolAdapter,
  ExtendedProtocolAdapter,
  ProtocolStats
} from './base/adapter.js';

export type {
  DetectionResult
} from './base/detector.js';

export { ProtocolDetector } from './base/detector.js';
export { BaseProtocolAdapter } from './base/adapter.js';

// Re-export monitoring types
export type {
  UniversalMonitorConfig,
  SecurityConfig
} from '../monitoring/universal-monitor.js';

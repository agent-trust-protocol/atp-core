/**
 * Protocols Module
 *
 * Multi-protocol support for AI agents with ATP security
 *
 * Experimental infrastructure: detection does not establish interoperability.
 * MCP monitoring emits synthetic events; security defaults fail closed.
 * See repository docs/PROTOCOL-SUPPORT.md, including planned ANP integration.
 */

// Base protocol abstractions
export * from './base/index.js';

// Protocol implementations
export * from './mcp/index.js';

// Protocol is an enum, so it must be exported as a value for runtime use.
export { Protocol } from './base/types.js';

// Re-export commonly used types
export type {
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

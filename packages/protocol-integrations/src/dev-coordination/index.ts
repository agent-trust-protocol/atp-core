/**
 * ATP Protocol Integration Development Coordination Framework
 * 
 * This module provides shared development infrastructure for coordinating
 * 4 specialist agents working in parallel on protocol integrations:
 * 
 * - MCP-Agent: Anthropic MCP protocol integration with security wrapper
 * - A2A-Agent: Google A2A protocol with trust bridge implementation
 * - Enterprise-Agent: IBM ACP/Cisco AGP enterprise compatibility bridges
 * - ANP-Agent: ANP federation for cross-domain agents
 */

export * from './types';
export * from './workspace-manager';
export * from './agent-coordinator';
export * from './protocol-registry';
export * from './shared-infrastructure';
export * from './inter-agent-messaging';

// Main coordination entry point
export { SharedInfrastructure } from './shared-infrastructure';
export { coordination, app } from './coordination-server';
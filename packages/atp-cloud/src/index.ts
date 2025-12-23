/**
 * ATP Cloud - Multi-tenant Agent Trust Protocol Cloud Platform
 * 
 * ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE
 * 
 * This is the main entry point for the ATP Cloud platform.
 * It orchestrates the multi-tenant cloud services for Agent Trust Protocol.
 */

export * from './cloud-gateway/index.js';
export * from './tenant-service/index.js';
export * from './analytics-service/index.js';
export * from './types/index.js';
export * from './shared/index.js';

// Version and metadata
export const ATP_CLOUD_VERSION = '0.1.0-alpha';
export const ATP_CLOUD_BUILD = 'internal-testing';

console.log(`🔐 ATP Cloud v${ATP_CLOUD_VERSION} (${ATP_CLOUD_BUILD})`);
console.log(`⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE`);
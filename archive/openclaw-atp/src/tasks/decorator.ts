/**
 * ATP Task Decorator
 * 
 * Decorator for OpenClaw tasks that adds ATP security metadata and validation
 */

import type { TaskSecurityMetadata } from './types.js';

/**
 * Decorator to protect a task with ATP security
 * 
 * @example
 * ```typescript
 * @atpProtectedTask({
 *   requiredTrust: 0.9,
 *   policy: "financial_operations",
 *   dataClassification: "financial"
 * })
 * async function executeTradeTask(params) {
 *   // Task implementation
 * }
 * ```
 */
export function atpProtectedTask(securityConfig: Partial<TaskSecurityMetadata>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Attach metadata to the function
    const metadata: TaskSecurityMetadata = {
      requiredTrust: securityConfig.requiredTrust || 0.7,
      policy: securityConfig.policy || 'default',
      dataClassification: securityConfig.dataClassification || 'internal',
      sensitivityLevel: securityConfig.sensitivityLevel || 'medium',
      enhancedAudit: securityConfig.enhancedAudit ?? true,
      requireMFA: securityConfig.requireMFA ?? false,
      maxExecutionTime: securityConfig.maxExecutionTime,
      allowedRoles: securityConfig.allowedRoles,
      validators: securityConfig.validators
    };

    // Store metadata on the function for later retrieval
    originalMethod._atpSecurityMetadata = metadata;

    // Optionally wrap the function to add runtime checks
    descriptor.value = async function (this: any, ...args: any[]) {
      console.log(`🔐 ATP Protected Task: ${propertyKey}`);
      console.log(`   Required Trust: ${metadata.requiredTrust}`);
      console.log(`   Policy: ${metadata.policy}`);
      console.log(`   Classification: ${metadata.dataClassification}`);
      
      // The actual validation will be done by ATPTaskValidator
      // This decorator just marks the task with metadata
      
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Helper to extract ATP metadata from a task function
 */
export function getTaskSecurityMetadata(taskFunction: Function): TaskSecurityMetadata | null {
  return (taskFunction as any)._atpSecurityMetadata || null;
}

/**
 * Create ATP task metadata for SimpleTask
 */
export function createTaskMetadata(config: Partial<TaskSecurityMetadata>): { atp: TaskSecurityMetadata } {
  return {
    atp: {
      requiredTrust: config.requiredTrust || 0.7,
      policy: config.policy || 'default',
      dataClassification: config.dataClassification|| 'internal',
      sensitivityLevel: config.sensitivityLevel || 'medium',
      enhancedAudit: config.enhancedAudit ?? true,
      requireMFA: config.requireMFA ?? false,
      maxExecutionTime: config.maxExecutionTime,
      allowedRoles: config.allowedRoles,
      validators: config.validators
    }
  };
}

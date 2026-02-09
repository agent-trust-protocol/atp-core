/**
 * ATP Task Validator
 * 
 * Validates that agents have sufficient permissions and trust to execute tasks
 */

import type { ATPClient } from 'atp-sdk';
import type { AgentMetadata } from '../agent/types.js';
import type {
  TaskSecurityMetadata,
  TaskValidationResult,
  TaskExecutionContext
} from './types.js';

export class ATPTaskValidator {
  private atpClient: ATPClient;

  constructor(atpClient: ATPClient) {
    this.atpClient = atpClient;
  }

  /**
   * Validate if an agent can execute a task
   */
  async validateTask(
    agentMeta: AgentMetadata,
    taskMetadata: TaskSecurityMetadata,
    taskName: string,
    inputs?: Record<string, any>
  ): Promise<TaskValidationResult> {
    const result: TaskValidationResult = {
      allowed: true,
      errors: [],
      warnings: [],
      appliedPolicies: [taskMetadata.policy],
      trustCheck: {
        currentScore: agentMeta.trustScore,
        requiredScore: taskMetadata.requiredTrust,
        passed: false
      },
      permissionCheck: {
        passed: false,
        missingPermissions: []
      }
    };

    // 1. Check trust level
    if (agentMeta.trustScore < taskMetadata.requiredTrust) {
      result.allowed = false;
      result.trustCheck.passed = false;
      result.errors.push(
        `Insufficient trust level: ${agentMeta.trustScore.toFixed(2)} < ${taskMetadata.requiredTrust.toFixed(2)}`
      );
    } else {
      result.trustCheck.passed = true;
    }

    // Warning if trust is marginally above requirement
    if (agentMeta.trustScore < taskMetadata.requiredTrust + 0.05 && result.trustCheck.passed) {
      result.warnings.push(
        `Trust level is marginally above requirement (${agentMeta.trustScore.toFixed(2)} vs ${taskMetadata.requiredTrust.toFixed(2)})`
      );
    }

    // 2. Check role permissions
    if (taskMetadata.allowedRoles && taskMetadata.allowedRoles.length > 0) {
      if (!taskMetadata.allowedRoles.includes(agentMeta.role)) {
        result.allowed = false;
        result.errors.push(
          `Agent role '${agentMeta.role}' not in allowed roles: ${taskMetadata.allowedRoles.join(', ')}`
        );
      }
    }

    // 3. Check ATP permissions
    try {
      const permissionCheck = await this.atpClient.permissions.checkAccess({
        subject: agentMeta.did,
        action: 'execute',
        resource: `task:${taskName}`,
        context: {
          trustScore: agentMeta.trustScore,
          dataClassification: taskMetadata.dataClassification,
          policy: taskMetadata.policy
        }
      });

      result.permissionCheck.passed = permissionCheck.allowed;
      
      if (!permissionCheck.allowed) {
        result.allowed = false;
        result.errors.push(`Permission denied: ${permissionCheck.reason || 'Unknown reason'}`);
      }
    } catch (error) {
      result.allowed = false;
      result.errors.push(`Permission check failed: ${(error as Error).message}`);
      result.permissionCheck.passed = false;
    }

    // 4. Check data classification vs agent capabilities
    const dataClassificationLevels = ['public', 'internal', 'confidential', 'pii', 'financial'];
    const taskLevel = dataClassificationLevels.indexOf(taskMetadata.dataClassification);
    
    const hasCapability = agentMeta.capabilities.some(cap => 
      cap.includes(taskMetadata.dataClassification) || 
      cap.includes('admin') || 
      cap.includes('all-access')
    );

    if (taskLevel >= 3 && !hasCapability) { // PII or Financial
      result.warnings.push(
        `Agent handling sensitive data (${taskMetadata.dataClassification}) without explicit capability`
      );
    }

    // 5. Run custom validators if provided
    if (taskMetadata.validators) {
      for (const validator of taskMetadata.validators) {
        try {
          const context = { agentMeta, taskMetadata, taskName, inputs };
          const validatorPassed = await validator(context);
          
          if (!validatorPassed) {
            result.allowed = false;
            result.errors.push('Custom validator failed');
          }
        } catch (error) {
          result.allowed = false;
          result.errors.push(`Custom validator error: ${(error as Error).message}`);
        }
      }
    }

    // 6. Log validation result
    await this.logValidation(agentMeta.did, taskName, result);

    return result;
  }

  /**
   * Create task execution context after validation
   */
  async createExecutionContext(
    taskId: string,
    taskName: string,
    agentMeta: AgentMetadata,
    taskMetadata: TaskSecurityMetadata,
    inputs: Record<string, any>
  ): Promise<TaskExecutionContext> {
    const context: TaskExecutionContext = {
      taskId,
      taskName,
      agentDid: agentMeta.did,
      security: taskMetadata,
      inputs,
      startTime: new Date()
    };

    // Log task start
    await this.atpClient.audit.log({
      eventType: 'task-execution-start',
      agentDid: agentMeta.did,
      severity: 'info',
      metadata: {
        taskId,
        taskName,
        dataClassification: taskMetadata.dataClassification,
        requiredTrust: taskMetadata.requiredTrust,
        policy: taskMetadata.policy
      }
    });

    return context;
  }

  /**
   * Mark task as completed
   */
  async completeTask(
    context: TaskExecutionContext,
    success: boolean,
    result?: any,
    error?: Error
  ): Promise<void> {
    const executionTime = Date.now() - context.startTime.getTime();

    await this.atpClient.audit.log({
      eventType: success ? 'task-execution-success' : 'task-execution-failure',
      agentDid: context.agentDid,
      severity: success ? 'info' : 'error',
      metadata: {
        taskId: context.taskId,
        taskName: context.taskName,
        executionTime,
        dataClassification: context.security.dataClassification,
        error: error?.message
      }
    });

    // Check execution time against limit
    if (context.security.maxExecutionTime && executionTime > context.security.maxExecutionTime) {
      await this.atpClient.audit.log({
        eventType: 'task-execution-timeout-warning',
        agentDid: context.agentDid,
        severity: 'warning',
        metadata: {
          taskId: context.taskId,
          executionTime,
          maxExecutionTime: context.security.maxExecutionTime
        }
      });
    }
  }

  /**
   * Log validation result
   */
  private async logValidation(
    agentDid: string,
    taskName: string,
    result: TaskValidationResult
  ): Promise<void> {
    await this.atpClient.audit.log({
      eventType: 'task-validation',
      agentDid,
      severity: result.allowed ? 'info' : 'warning',
      metadata: {
        taskName,
        allowed: result.allowed,
        errors: result.errors,
        warnings: result.warnings,
        trustCheck: result.trustCheck,
        permissionCheck: result.permissionCheck
      }
    });
  }
}

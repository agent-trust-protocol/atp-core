import { CronJob } from 'cron';
import * as cronParser from 'cron-parser';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { NodeRegistry } from '../core/NodeRegistry';
import { workflowRepository } from '../database/repository';
import { EventEmitter } from 'events';

interface ScheduledWorkflow {
  workflowId: string;
  cronExpression: string;
  job: CronJob;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

export class WorkflowScheduler extends EventEmitter {
  private workflowEngine: WorkflowEngine;
  private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    const nodeRegistry = new NodeRegistry();
    this.workflowEngine = new WorkflowEngine(nodeRegistry);
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('WorkflowScheduler already initialized');
      return;
    }

    try {
      console.log('Initializing workflow scheduler...');
      
      // Load scheduled workflows from database
      await this.loadScheduledWorkflows();
      
      this.isInitialized = true;
      console.log(`Workflow scheduler initialized with ${this.scheduledWorkflows.size} scheduled workflows`);
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize workflow scheduler:', error);
      throw error;
    }
  }

  private async loadScheduledWorkflows() {
    try {
      // Get all workflows with schedule triggers
      const workflows = await workflowRepository.listWorkflows(1000, 0);
      
      for (const workflow of workflows) {
        const scheduleTriggers = workflow.triggers?.filter(
          trigger => trigger.type === 'schedule' && trigger.config?.schedule
        ) || [];

        for (const trigger of scheduleTriggers) {
          if (trigger.config?.schedule) {
            await this.scheduleWorkflow(
              workflow.id,
              trigger.config.schedule,
              trigger.enabled !== false
            );
          }
        }
      }
    } catch (error) {
      console.error('Error loading scheduled workflows:', error);
      throw error;
    }
  }

  async scheduleWorkflow(
    workflowId: string,
    cronExpression: string,
    enabled: boolean = true
  ): Promise<void> {
    try {
      // Validate cron expression
      cronParser.parseExpression(cronExpression);
      
      // Remove existing schedule if any
      await this.unscheduleWorkflow(workflowId);
      
      // Create new cron job
      const job = new CronJob(
        cronExpression,
        () => this.executeScheduledWorkflow(workflowId),
        null,
        false,
        'UTC'
      );

      const scheduledWorkflow: ScheduledWorkflow = {
        workflowId,
        cronExpression,
        job,
        enabled,
        runCount: 0
      };

      // Calculate next run time
      if (enabled) {
        const interval = cronParser.parseExpression(cronExpression);
        scheduledWorkflow.nextRun = interval.next().toDate();
        job.start();
      }

      this.scheduledWorkflows.set(workflowId, scheduledWorkflow);
      
      console.log(`Scheduled workflow ${workflowId} with expression: ${cronExpression}`);
      this.emit('workflow:scheduled', { workflowId, cronExpression, enabled });
      
    } catch (error) {
      console.error(`Failed to schedule workflow ${workflowId}:`, error);
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
  }

  async unscheduleWorkflow(workflowId: string): Promise<void> {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (scheduled) {
      scheduled.job.stop();
      scheduled.job.destroy();
      this.scheduledWorkflows.delete(workflowId);
      
      console.log(`Unscheduled workflow ${workflowId}`);
      this.emit('workflow:unscheduled', { workflowId });
    }
  }

  async enableSchedule(workflowId: string): Promise<void> {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (scheduled) {
      scheduled.enabled = true;
      scheduled.job.start();
      
      // Update next run time
      const interval = cronParser.parseExpression(scheduled.cronExpression);
      scheduled.nextRun = interval.next().toDate();
      
      console.log(`Enabled schedule for workflow ${workflowId}`);
      this.emit('workflow:schedule-enabled', { workflowId });
    } else {
      throw new Error(`No schedule found for workflow ${workflowId}`);
    }
  }

  async disableSchedule(workflowId: string): Promise<void> {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (scheduled) {
      scheduled.enabled = false;
      scheduled.job.stop();
      scheduled.nextRun = undefined;
      
      console.log(`Disabled schedule for workflow ${workflowId}`);
      this.emit('workflow:schedule-disabled', { workflowId });
    } else {
      throw new Error(`No schedule found for workflow ${workflowId}`);
    }
  }

  private async executeScheduledWorkflow(workflowId: string): Promise<void> {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (!scheduled || !scheduled.enabled) {
      return;
    }

    try {
      console.log(`Executing scheduled workflow: ${workflowId}`);
      
      // Update last run time
      scheduled.lastRun = new Date();
      scheduled.runCount++;
      
      // Calculate next run time
      const interval = cronParser.parseExpression(scheduled.cronExpression);
      scheduled.nextRun = interval.next().toDate();
      
      // Get workflow from database
      const workflow = await workflowRepository.getWorkflow(workflowId);
      
      if (!workflow) {
        console.error(`Scheduled workflow ${workflowId} not found in database`);
        await this.unscheduleWorkflow(workflowId);
        return;
      }

      // Register and execute workflow
      await this.workflowEngine.registerWorkflow(workflow);
      
      const result = await this.workflowEngine.executeWorkflow(
        workflowId,
        {},
        {
          executionId: `scheduled-${Date.now()}`,
          workflowId,
          startTime: new Date(),
          state: 'running' as any,
          currentNodeId: null,
          data: {},
          errors: [],
          completedNodes: [],
          user: {
            id: 'scheduler',
            name: 'Workflow Scheduler'
          }
        }
      );

      // Update statistics
      await workflowRepository.updateWorkflowStats(workflowId, result);
      
      console.log(`Scheduled workflow ${workflowId} completed:`, result.success ? 'SUCCESS' : 'FAILED');
      
      this.emit('workflow:executed', {
        workflowId,
        result,
        trigger: 'schedule',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Error executing scheduled workflow ${workflowId}:`, error);
      
      this.emit('workflow:execution-failed', {
        workflowId,
        error: error instanceof Error ? error.message : 'Unknown error',
        trigger: 'schedule',
        timestamp: new Date()
      });
    }
  }

  getScheduledWorkflows(): Array<{
    workflowId: string;
    cronExpression: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
  }> {
    return Array.from(this.scheduledWorkflows.values()).map(scheduled => ({
      workflowId: scheduled.workflowId,
      cronExpression: scheduled.cronExpression,
      enabled: scheduled.enabled,
      lastRun: scheduled.lastRun,
      nextRun: scheduled.nextRun,
      runCount: scheduled.runCount
    }));
  }

  getSchedule(workflowId: string) {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (!scheduled) {
      return null;
    }

    return {
      workflowId: scheduled.workflowId,
      cronExpression: scheduled.cronExpression,
      enabled: scheduled.enabled,
      lastRun: scheduled.lastRun,
      nextRun: scheduled.nextRun,
      runCount: scheduled.runCount
    };
  }

  async updateSchedule(
    workflowId: string,
    cronExpression: string,
    enabled?: boolean
  ): Promise<void> {
    const existing = this.scheduledWorkflows.get(workflowId);
    const shouldEnable = enabled !== undefined ? enabled : existing?.enabled || true;
    
    await this.scheduleWorkflow(workflowId, cronExpression, shouldEnable);
  }

  validateCronExpression(cronExpression: string): boolean {
    try {
      cronParser.parseExpression(cronExpression);
      return true;
    } catch {
      return false;
    }
  }

  getNextRunTime(cronExpression: string): Date | null {
    try {
      const interval = cronParser.parseExpression(cronExpression);
      return interval.next().toDate();
    } catch {
      return null;
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down workflow scheduler...');
    
    // Stop all scheduled jobs
    for (const [workflowId, scheduled] of this.scheduledWorkflows) {
      scheduled.job.stop();
      scheduled.job.destroy();
      console.log(`Stopped schedule for workflow: ${workflowId}`);
    }
    
    this.scheduledWorkflows.clear();
    this.isInitialized = false;
    
    this.emit('shutdown');
    console.log('Workflow scheduler shutdown complete');
  }

  isWorkflowScheduled(workflowId: string): boolean {
    return this.scheduledWorkflows.has(workflowId);
  }

  getStatistics() {
    const schedules = this.getScheduledWorkflows();
    
    return {
      totalScheduled: schedules.length,
      enabled: schedules.filter(s => s.enabled).length,
      disabled: schedules.filter(s => !s.enabled).length,
      totalRuns: schedules.reduce((sum, s) => sum + s.runCount, 0),
      upcomingRuns: schedules
        .filter(s => s.enabled && s.nextRun)
        .sort((a, b) => a.nextRun!.getTime() - b.nextRun!.getTime())
        .slice(0, 10)
        .map(s => ({
          workflowId: s.workflowId,
          nextRun: s.nextRun
        }))
    };
  }
}
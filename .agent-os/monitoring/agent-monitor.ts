/**
 * ATP Agent Monitoring System
 * Real-time monitoring and coordination for Claude Code and BMAD-METHOD agents
 */

import { AgentIdentifier, TaskStatus, TaskStatusType } from '../protocols/handoff-protocol';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AgentMetrics {
  agent_id: AgentIdentifier;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_failed: number;
  average_completion_time_ms: number;
  current_load: number;
  last_active: Date;
}

export interface TaskMetrics {
  task_id: string;
  status: TaskStatusType;
  assigned_agent: AgentIdentifier;
  start_time: Date;
  end_time?: Date;
  duration_ms?: number;
  error_count: number;
  retry_count: number;
}

export interface SystemHealth {
  timestamp: Date;
  active_agents: number;
  active_tasks: number;
  completed_tasks_24h: number;
  failed_tasks_24h: number;
  average_task_duration_ms: number;
  system_load: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: AlertType;
  message: string;
  timestamp: Date;
  agent?: AgentIdentifier;
  task_id?: string;
}

export type AlertType = 
  | 'task_failed'
  | 'agent_overloaded'
  | 'agent_unresponsive'
  | 'deadline_missed'
  | 'build_failure'
  | 'test_failure'
  | 'security_issue';

/**
 * Agent Monitor Class
 */
export class AgentMonitor {
  private agentMetrics = new Map<AgentIdentifier, AgentMetrics>();
  private taskMetrics = new Map<string, TaskMetrics>();
  private alerts: Alert[] = [];
  private scratchpadPath = '.cursor/scratchpad.md';
  private statusBoardPath = 'PROJECT_STATUS_BOARD.md';

  /**
   * Initialize monitoring system
   */
  public async initialize(): Promise<void> {
    // Initialize agent metrics
    this.initializeAgentMetrics();
    
    // Load existing state from scratchpad
    await this.loadStateFromScratchpad();
    
    // Start monitoring loops
    this.startMonitoringLoops();
  }

  private initializeAgentMetrics(): void {
    const agents: AgentIdentifier[] = [
      'claude-code:master',
      'claude-code:build',
      'claude-code:ui',
      'claude-code:api',
      'claude-code:security',
      'claude-code:integration',
      'bmad:dev',
      'bmad:qa',
      'bmad:architect',
      'bmad:ux-expert'
    ];

    agents.forEach(agent => {
      this.agentMetrics.set(agent, {
        agent_id: agent,
        tasks_assigned: 0,
        tasks_completed: 0,
        tasks_failed: 0,
        average_completion_time_ms: 0,
        current_load: 0,
        last_active: new Date()
      });
    });
  }

  /**
   * Track task assignment
   */
  public trackTaskAssignment(
    task_id: string,
    agent: AgentIdentifier
  ): void {
    // Update task metrics
    this.taskMetrics.set(task_id, {
      task_id,
      status: 'assigned',
      assigned_agent: agent,
      start_time: new Date(),
      error_count: 0,
      retry_count: 0
    });

    // Update agent metrics
    const agentMetric = this.agentMetrics.get(agent);
    if (agentMetric) {
      agentMetric.tasks_assigned++;
      agentMetric.current_load++;
      agentMetric.last_active = new Date();
    }

    // Log to scratchpad
    this.logToScratchpad(`Task ${task_id} assigned to ${agent}`);
  }

  /**
   * Track task completion
   */
  public trackTaskCompletion(
    task_id: string,
    success: boolean
  ): void {
    const task = this.taskMetrics.get(task_id);
    if (!task) return;

    // Update task metrics
    task.status = success ? 'completed' : 'failed';
    task.end_time = new Date();
    task.duration_ms = task.end_time.getTime() - task.start_time.getTime();

    // Update agent metrics
    const agentMetric = this.agentMetrics.get(task.assigned_agent);
    if (agentMetric) {
      if (success) {
        agentMetric.tasks_completed++;
      } else {
        agentMetric.tasks_failed++;
      }
      agentMetric.current_load = Math.max(0, agentMetric.current_load - 1);
      
      // Update average completion time
      const totalTasks = agentMetric.tasks_completed + agentMetric.tasks_failed;
      if (totalTasks > 0) {
        agentMetric.average_completion_time_ms = 
          (agentMetric.average_completion_time_ms * (totalTasks - 1) + task.duration_ms) / totalTasks;
      }
    }

    // Create alert if task failed
    if (!success) {
      this.createAlert('critical', 'task_failed', 
        `Task ${task_id} failed on ${task.assigned_agent}`, 
        task.assigned_agent, 
        task_id
      );
    }

    // Update status board
    this.updateStatusBoard();
  }

  /**
   * Create an alert
   */
  public createAlert(
    severity: Alert['severity'],
    type: AlertType,
    message: string,
    agent?: AgentIdentifier,
    task_id?: string
  ): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      type,
      message,
      timestamp: new Date(),
      agent,
      task_id
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts to scratchpad
    if (severity === 'critical') {
      this.logToScratchpad(`CRITICAL ALERT: ${message}`);
    }
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): SystemHealth {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate 24h metrics
    let completed24h = 0;
    let failed24h = 0;
    let totalDuration = 0;
    let taskCount = 0;

    this.taskMetrics.forEach(task => {
      if (task.end_time && task.end_time > dayAgo) {
        if (task.status === 'completed') completed24h++;
        if (task.status === 'failed') failed24h++;
        if (task.duration_ms) {
          totalDuration += task.duration_ms;
          taskCount++;
        }
      }
    });

    // Calculate active agents
    let activeAgents = 0;
    let totalLoad = 0;
    this.agentMetrics.forEach(agent => {
      if (agent.current_load > 0) activeAgents++;
      totalLoad += agent.current_load;
    });

    return {
      timestamp: now,
      active_agents: activeAgents,
      active_tasks: totalLoad,
      completed_tasks_24h: completed24h,
      failed_tasks_24h: failed24h,
      average_task_duration_ms: taskCount > 0 ? totalDuration / taskCount : 0,
      system_load: totalLoad,
      alerts: this.alerts.filter(a => a.timestamp > dayAgo)
    };
  }

  /**
   * Get agent performance metrics
   */
  public getAgentPerformance(agent: AgentIdentifier): AgentMetrics | undefined {
    return this.agentMetrics.get(agent);
  }

  /**
   * Get task status
   */
  public getTaskStatus(task_id: string): TaskMetrics | undefined {
    return this.taskMetrics.get(task_id);
  }

  /**
   * Monitor agent health
   */
  private startMonitoringLoops(): void {
    // Check agent health every minute
    setInterval(() => {
      this.checkAgentHealth();
    }, 60000);

    // Update status board every 5 minutes
    setInterval(() => {
      this.updateStatusBoard();
    }, 300000);

    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000);
  }

  private checkAgentHealth(): void {
    const now = new Date();
    const threshold = 5 * 60 * 1000; // 5 minutes

    this.agentMetrics.forEach((metrics, agent) => {
      // Check if agent is unresponsive
      if (metrics.current_load > 0 && 
          now.getTime() - metrics.last_active.getTime() > threshold) {
        this.createAlert('warning', 'agent_unresponsive', 
          `Agent ${agent} has not responded in 5 minutes`, agent);
      }

      // Check if agent is overloaded
      if (metrics.current_load > 5) {
        this.createAlert('warning', 'agent_overloaded', 
          `Agent ${agent} has ${metrics.current_load} active tasks`, agent);
      }
    });
  }

  private async loadStateFromScratchpad(): Promise<void> {
    try {
      const content = await fs.readFile(this.scratchpadPath, 'utf-8');
      // Parse relevant state from scratchpad
      // This is simplified - in reality would parse the markdown structure
      console.log('Loaded state from scratchpad');
    } catch (error) {
      console.log('No existing scratchpad found');
    }
  }

  private async logToScratchpad(message: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `\n[${timestamp}] ${message}\n`;
      await fs.appendFile(this.scratchpadPath, logEntry);
    } catch (error) {
      console.error('Failed to log to scratchpad:', error);
    }
  }

  private async updateStatusBoard(): Promise<void> {
    try {
      const health = this.getSystemHealth();
      const content = this.generateStatusBoardContent(health);
      await fs.writeFile(this.statusBoardPath, content);
    } catch (error) {
      console.error('Failed to update status board:', error);
    }
  }

  private generateStatusBoardContent(health: SystemHealth): string {
    return `# ATP Project Status Board

## System Health
- **Timestamp**: ${health.timestamp.toISOString()}
- **Active Agents**: ${health.active_agents}
- **Active Tasks**: ${health.active_tasks}
- **System Load**: ${health.system_load}

## 24-Hour Metrics
- **Completed Tasks**: ${health.completed_tasks_24h}
- **Failed Tasks**: ${health.failed_tasks_24h}
- **Average Duration**: ${Math.round(health.average_task_duration_ms / 1000)}s

## Recent Alerts
${health.alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}

## Agent Performance
${Array.from(this.agentMetrics.values())
  .filter(a => a.current_load > 0 || a.tasks_completed > 0)
  .map(a => `### ${a.agent_id}
- Tasks: ${a.tasks_completed} completed, ${a.tasks_failed} failed
- Current Load: ${a.current_load}
- Avg Time: ${Math.round(a.average_completion_time_ms / 1000)}s`)
  .join('\n\n')}
`;
  }

  private cleanOldMetrics(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Clean old tasks
    this.taskMetrics.forEach((task, id) => {
      if (task.end_time && task.end_time < cutoff) {
        this.taskMetrics.delete(id);
      }
    });

    // Clean old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }
}

/**
 * Dashboard Generator
 */
export class DashboardGenerator {
  private monitor: AgentMonitor;

  constructor(monitor: AgentMonitor) {
    this.monitor = monitor;
  }

  /**
   * Generate HTML dashboard
   */
  public generateDashboard(): string {
    const health = this.monitor.getSystemHealth();
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>ATP Agent Monitor Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
    .metric-label { color: #666; margin-top: 5px; }
    .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
    .alert-critical { background: #fee; border-left: 4px solid #dc2626; }
    .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .alert-info { background: #e0f2fe; border-left: 4px solid #0284c7; }
    .status-active { color: #10b981; }
    .status-idle { color: #6b7280; }
    h1 { color: #1f2937; }
    h2 { color: #4b5563; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 ATP Agent Monitor Dashboard</h1>
    
    <div class="card">
      <h2>System Health</h2>
      <div class="metric">
        <div class="metric-value">${health.active_agents}</div>
        <div class="metric-label">Active Agents</div>
      </div>
      <div class="metric">
        <div class="metric-value">${health.active_tasks}</div>
        <div class="metric-label">Active Tasks</div>
      </div>
      <div class="metric">
        <div class="metric-value">${health.completed_tasks_24h}</div>
        <div class="metric-label">Completed (24h)</div>
      </div>
      <div class="metric">
        <div class="metric-value">${health.failed_tasks_24h}</div>
        <div class="metric-label">Failed (24h)</div>
      </div>
    </div>
    
    <div class="card">
      <h2>Recent Alerts</h2>
      ${health.alerts.length === 0 ? '<p>No recent alerts</p>' : 
        health.alerts.map(a => 
          `<div class="alert alert-${a.severity}">
            <strong>${a.type}</strong>: ${a.message}
            <span style="float: right; color: #999;">${a.timestamp.toLocaleTimeString()}</span>
          </div>`
        ).join('')}
    </div>
    
    <div class="card">
      <h2>Agent Status</h2>
      <table style="width: 100%;">
        <thead>
          <tr>
            <th style="text-align: left;">Agent</th>
            <th>Status</th>
            <th>Load</th>
            <th>Completed</th>
            <th>Failed</th>
            <th>Avg Time</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(this.monitor['agentMetrics'].values()).map(a => `
            <tr>
              <td>${a.agent_id}</td>
              <td class="${a.current_load > 0 ? 'status-active' : 'status-idle'}">
                ${a.current_load > 0 ? 'Active' : 'Idle'}
              </td>
              <td>${a.current_load}</td>
              <td>${a.tasks_completed}</td>
              <td>${a.tasks_failed}</td>
              <td>${Math.round(a.average_completion_time_ms / 1000)}s</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div style="text-align: center; color: #999; margin-top: 40px;">
      Last updated: ${health.timestamp.toLocaleString()}
    </div>
  </div>
</body>
</html>`;
  }
}

// Export for use
export default {
  AgentMonitor,
  DashboardGenerator
};
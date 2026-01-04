/**
 * High-Availability Clustering for ATP
 * Enterprise-grade clustering with load balancing and failover
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';

export enum NodeRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  WORKER = 'worker',
  OBSERVER = 'observer'
}

export enum NodeStatus {
  ACTIVE = 'active',
  STANDBY = 'standby',
  UNHEALTHY = 'unhealthy',
  FAILED = 'failed',
  MAINTENANCE = 'maintenance'
}

export enum ClusterTopology {
  ACTIVE_PASSIVE = 'active-passive',
  ACTIVE_ACTIVE = 'active-active',
  MASTER_SLAVE = 'master-slave',
  MESH = 'mesh',
  RING = 'ring'
}

export interface ClusterNode {
  id: string;
  name: string;
  role: NodeRole;
  status: NodeStatus;
  address: string;
  port: number;
  region: string;
  zone: string;
  capabilities: string[];
  resources: NodeResources;
  metadata: Record<string, any>;
  lastHeartbeat: number;
  joinedAt: number;
  version: string;
  health: NodeHealth;
}

export interface NodeResources {
  cpu: {
    cores: number;
    usage: number; // percentage
    loadAverage: number[];
  };
  memory: {
    total: number; // bytes
    used: number;
    available: number;
    usage: number; // percentage
  };
  storage: {
    total: number; // bytes
    used: number;
    available: number;
    usage: number; // percentage
  };
  network: {
    bandwidth: number; // bytes/sec
    latency: number; // milliseconds
    throughput: number; // requests/sec
  };
}

export interface NodeHealth {
  score: number; // 0-100
  checks: HealthCheck[];
  lastCheck: number;
  consecutiveFailures: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'tcp' | 'custom';
  interval: number;
  timeout: number;
  retries: number;
  endpoint?: string;
  status: 'pass' | 'fail' | 'warn';
  lastRun: number;
  duration: number;
  message: string;
}

export interface ClusterConfiguration {
  name: string;
  topology: ClusterTopology;
  minNodes: number;
  maxNodes: number;
  autoScaling: AutoScalingConfig;
  loadBalancing: LoadBalancingConfig;
  failover: FailoverConfig;
  consensus: ConsensusConfig;
  security: ClusterSecurityConfig;
  monitoring: ClusterMonitoringConfig;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization: number;
  targetMemoryUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

export interface LoadBalancingConfig {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'least-response-time';
  healthCheckEnabled: boolean;
  sessionAffinity: boolean;
  weights: Record<string, number>;
}

export interface FailoverConfig {
  enabled: boolean;
  automaticFailover: boolean;
  failoverTimeout: number;
  maxFailoverAttempts: number;
  backupNodes: number;
  quorumSize: number;
}

export interface ConsensusConfig {
  algorithm: 'raft' | 'paxos' | 'pbft';
  quorumSize: number;
  electionTimeout: number;
  heartbeatInterval: number;
  logRetention: number;
}

export interface ClusterSecurityConfig {
  encryptionEnabled: boolean;
  mutualTLS: boolean;
  tokenAuth: boolean;
  allowedNetworks: string[];
  keyRotationInterval: number;
}

export interface ClusterMonitoringConfig {
  metricsEnabled: boolean;
  loggingEnabled: boolean;
  alertingEnabled: boolean;
  retentionPeriod: number;
}

export interface ClusterEvent {
  id: string;
  type: ClusterEventType;
  timestamp: number;
  nodeId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata: Record<string, any>;
}

export enum ClusterEventType {
  NODE_JOINED = 'node-joined',
  NODE_LEFT = 'node-left',
  NODE_FAILED = 'node-failed',
  NODE_RECOVERED = 'node-recovered',
  LEADER_ELECTED = 'leader-elected',
  FAILOVER_STARTED = 'failover-started',
  FAILOVER_COMPLETED = 'failover-completed',
  SCALING_UP = 'scaling-up',
  SCALING_DOWN = 'scaling-down',
  PARTITION_DETECTED = 'partition-detected',
  CONSENSUS_LOST = 'consensus-lost',
  HEALTH_CHECK_FAILED = 'health-check-failed'
}

export interface ClusterMetrics {
  nodeCount: number;
  healthyNodes: number;
  activeNodes: number;
  totalRequests: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  networkThroughput: number;
  uptime: number;
  availability: number;
}

export class ClusterManager extends EventEmitter {
  private config: ClusterConfiguration;
  private nodes: Map<string, ClusterNode> = new Map();
  private currentLeader: string | null = null;
  private localNodeId: string;
  private events: ClusterEvent[] = [];
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private consensusState: ConsensusState = new ConsensusState();
  private loadBalancer: LoadBalancer;
  private autoScaler: AutoScaler;

  constructor(config: ClusterConfiguration, localNode: Partial<ClusterNode>) {
    super();
    this.config = config;
    this.localNodeId = localNode.id || this.generateNodeId();

    // Initialize local node
    const localNodeConfig: ClusterNode = {
      id: this.localNodeId,
      name: localNode.name || `node-${this.localNodeId}`,
      role: localNode.role || NodeRole.WORKER,
      status: NodeStatus.ACTIVE,
      address: localNode.address || '127.0.0.1',
      port: localNode.port || 8080,
      region: localNode.region || 'us-east-1',
      zone: localNode.zone || 'us-east-1a',
      capabilities: localNode.capabilities || ['agent-communication', 'policy-enforcement'],
      resources: localNode.resources || this.getDefaultResources(),
      metadata: localNode.metadata || {},
      lastHeartbeat: Date.now(),
      joinedAt: Date.now(),
      version: '1.0.0',
      health: {
        score: 100,
        checks: [],
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        status: 'healthy'
      }
    };

    this.nodes.set(this.localNodeId, localNodeConfig);
    this.loadBalancer = new LoadBalancer(config.loadBalancing);
    this.autoScaler = new AutoScaler(config.autoScaling, this);

    this.initializeCluster();
  }

  /**
   * Start the cluster manager
   */
  async start(): Promise<void> {
    await this.joinCluster();
    this.startHealthChecks();
    this.startConsensus();
    this.startMonitoring();

    if (this.config.autoScaling.enabled) {
      this.autoScaler.start();
    }

    this.emitEvent({
      type: ClusterEventType.NODE_JOINED,
      nodeId: this.localNodeId,
      severity: 'info',
      message: `Node ${this.localNodeId} joined the cluster`,
      metadata: { nodeRole: this.getLocalNode().role }
    });
  }

  /**
   * Stop the cluster manager
   */
  async stop(): Promise<void> {
    await this.leaveCluster();
    this.stopHealthChecks();
    this.stopConsensus();
    this.autoScaler.stop();

    this.emitEvent({
      type: ClusterEventType.NODE_LEFT,
      nodeId: this.localNodeId,
      severity: 'info',
      message: `Node ${this.localNodeId} left the cluster`,
      metadata: {}
    });
  }

  /**
   * Add a new node to the cluster
   */
  async addNode(node: Partial<ClusterNode>): Promise<ClusterNode> {
    const newNode: ClusterNode = {
      id: node.id || this.generateNodeId(),
      name: node.name || `node-${node.id}`,
      role: node.role || NodeRole.WORKER,
      status: NodeStatus.ACTIVE,
      address: node.address!,
      port: node.port!,
      region: node.region || 'us-east-1',
      zone: node.zone || 'us-east-1a',
      capabilities: node.capabilities || [],
      resources: node.resources || this.getDefaultResources(),
      metadata: node.metadata || {},
      lastHeartbeat: Date.now(),
      joinedAt: Date.now(),
      version: '1.0.0',
      health: {
        score: 100,
        checks: [],
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        status: 'healthy'
      }
    };

    this.nodes.set(newNode.id, newNode);
    this.loadBalancer.addNode(newNode);
    this.startNodeHealthChecks(newNode);

    this.emitEvent({
      type: ClusterEventType.NODE_JOINED,
      nodeId: newNode.id,
      severity: 'info',
      message: `Node ${newNode.id} added to cluster`,
      metadata: { nodeRole: newNode.role, nodeAddress: newNode.address }
    });

    return newNode;
  }

  /**
   * Remove a node from the cluster
   */
  async removeNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Check if removing this node violates minimum node requirements
    if (this.getHealthyNodeCount() <= this.config.minNodes) {
      throw new Error('Cannot remove node: would violate minimum node requirement');
    }

    this.nodes.delete(nodeId);
    this.loadBalancer.removeNode(nodeId);
    this.stopNodeHealthChecks(nodeId);

    // If the removed node was the leader, trigger leader election
    if (this.currentLeader === nodeId) {
      await this.electLeader();
    }

    this.emitEvent({
      type: ClusterEventType.NODE_LEFT,
      nodeId,
      severity: 'warning',
      message: `Node ${nodeId} removed from cluster`,
      metadata: { nodeRole: node.role }
    });

    return true;
  }

  /**
   * Get cluster status
   */
  getClusterStatus(): {
    healthy: boolean;
    nodeCount: number;
    healthyNodes: number;
    leader: string | null;
    consensus: boolean;
    metrics: ClusterMetrics;
    } {
    const nodeCount = this.nodes.size;
    const healthyNodes = this.getHealthyNodeCount();
    const consensus = this.hasConsensus();

    return {
      healthy: healthyNodes >= this.config.minNodes && consensus,
      nodeCount,
      healthyNodes,
      leader: this.currentLeader,
      consensus,
      metrics: this.getClusterMetrics()
    };
  }

  /**
   * Route request to available node
   */
  routeRequest(request: any): ClusterNode | null {
    return this.loadBalancer.selectNode(this.getHealthyNodes(), request);
  }

  /**
   * Perform manual failover
   */
  async performFailover(targetNodeId?: string): Promise<boolean> {
    if (!this.config.failover.enabled) {
      throw new Error('Failover is not enabled for this cluster');
    }

    this.emitEvent({
      type: ClusterEventType.FAILOVER_STARTED,
      severity: 'warning',
      message: 'Manual failover initiated',
      metadata: { targetNodeId }
    });

    try {
      const success = await this.executeFailover(targetNodeId);

      this.emitEvent({
        type: ClusterEventType.FAILOVER_COMPLETED,
        severity: success ? 'info' : 'error',
        message: `Failover ${success ? 'completed successfully' : 'failed'}`,
        metadata: { success, newLeader: this.currentLeader }
      });

      return success;
    } catch (error) {
      this.emitEvent({
        type: ClusterEventType.FAILOVER_COMPLETED,
        severity: 'error',
        message: `Failover failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      return false;
    }
  }

  /**
   * Scale the cluster
   */
  async scaleCluster(targetSize: number): Promise<boolean> {
    const currentSize = this.nodes.size;

    if (targetSize === currentSize) {
      return true;
    }

    if (targetSize > currentSize) {
      // Scale up
      return await this.scaleUp(targetSize - currentSize);
    } else {
      // Scale down
      return await this.scaleDown(currentSize - targetSize);
    }
  }

  /**
   * Get cluster events
   */
  getClusterEvents(limit: number = 100): ClusterEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Private methods

  private async joinCluster(): Promise<void> {
    // In a real implementation, this would involve service discovery
    // and connecting to existing cluster members
    console.log(`Node ${this.localNodeId} joining cluster ${this.config.name}`);
  }

  private async leaveCluster(): Promise<void> {
    // Gracefully leave the cluster
    console.log(`Node ${this.localNodeId} leaving cluster ${this.config.name}`);
  }

  private initializeCluster(): void {
    // Set up default health checks
    this.addDefaultHealthChecks();
  }

  private addDefaultHealthChecks(): void {
    const localNode = this.getLocalNode();

    localNode.health.checks = [
      {
        name: 'memory-usage',
        type: 'custom',
        interval: 30000,
        timeout: 5000,
        retries: 3,
        status: 'pass',
        lastRun: Date.now(),
        duration: 0,
        message: 'Memory usage within limits'
      },
      {
        name: 'cpu-usage',
        type: 'custom',
        interval: 30000,
        timeout: 5000,
        retries: 3,
        status: 'pass',
        lastRun: Date.now(),
        duration: 0,
        message: 'CPU usage within limits'
      },
      {
        name: 'disk-space',
        type: 'custom',
        interval: 60000,
        timeout: 5000,
        retries: 3,
        status: 'pass',
        lastRun: Date.now(),
        duration: 0,
        message: 'Disk space sufficient'
      }
    ];
  }

  private startHealthChecks(): void {
    // Start health checks for all nodes
    for (const node of this.nodes.values()) {
      this.startNodeHealthChecks(node);
    }
  }

  private stopHealthChecks(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }

  private startNodeHealthChecks(node: ClusterNode): void {
    const interval = setInterval(() => {
      this.performNodeHealthCheck(node);
    }, 30000); // Every 30 seconds

    this.healthCheckIntervals.set(node.id, interval);
  }

  private stopNodeHealthChecks(nodeId: string): void {
    const interval = this.healthCheckIntervals.get(nodeId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(nodeId);
    }
  }

  private async performNodeHealthCheck(node: ClusterNode): Promise<void> {
    const checks = node.health.checks;
    let passedChecks = 0;

    for (const check of checks) {
      const startTime = Date.now();
      let passed = false;

      try {
        passed = await this.executeHealthCheck(node, check);
        check.status = passed ? 'pass' : 'fail';
        check.message = passed ? 'Health check passed' : 'Health check failed';
      } catch (error: any) {
        check.status = 'fail';
        check.message = error?.message || String(error);
      }

      check.lastRun = Date.now();
      check.duration = Date.now() - startTime;

      if (passed) passedChecks++;
    }

    // Update node health
    const healthScore = (passedChecks / checks.length) * 100;
    node.health.score = healthScore;
    node.health.lastCheck = Date.now();

    if (healthScore >= 80) {
      node.health.status = 'healthy';
      node.health.consecutiveFailures = 0;
      if (node.status === NodeStatus.UNHEALTHY) {
        node.status = NodeStatus.ACTIVE;
        this.emitEvent({
          type: ClusterEventType.NODE_RECOVERED,
          nodeId: node.id,
          severity: 'info',
          message: `Node ${node.id} recovered`,
          metadata: { healthScore }
        });
      }
    } else if (healthScore >= 60) {
      node.health.status = 'degraded';
    } else {
      node.health.status = 'unhealthy';
      node.health.consecutiveFailures++;

      if (node.status !== NodeStatus.UNHEALTHY) {
        node.status = NodeStatus.UNHEALTHY;
        this.emitEvent({
          type: ClusterEventType.NODE_FAILED,
          nodeId: node.id,
          severity: 'error',
          message: `Node ${node.id} health check failed`,
          metadata: { healthScore, consecutiveFailures: node.health.consecutiveFailures }
        });
      }

      // Consider removing node after multiple consecutive failures
      if (node.health.consecutiveFailures >= 5) {
        await this.handleNodeFailure(node.id);
      }
    }

    node.lastHeartbeat = Date.now();
  }

  private async executeHealthCheck(node: ClusterNode, check: HealthCheck): Promise<boolean> {
    switch (check.type) {
      case 'http':
        return await this.httpHealthCheck(node, check);
      case 'tcp':
        return await this.tcpHealthCheck(node, check);
      case 'custom':
        return await this.customHealthCheck(node, check);
      default:
        return false;
    }
  }

  private async httpHealthCheck(node: ClusterNode, check: HealthCheck): Promise<boolean> {
    // Simplified HTTP health check
    return true; // Would make actual HTTP request
  }

  private async tcpHealthCheck(node: ClusterNode, check: HealthCheck): Promise<boolean> {
    // Simplified TCP health check
    return true; // Would test TCP connection
  }

  private async customHealthCheck(node: ClusterNode, check: HealthCheck): Promise<boolean> {
    // Custom health checks based on node resources
    switch (check.name) {
      case 'memory-usage':
        return node.resources.memory.usage < 90;
      case 'cpu-usage':
        return node.resources.cpu.usage < 90;
      case 'disk-space':
        return node.resources.storage.usage < 90;
      default:
        return true;
    }
  }

  private async handleNodeFailure(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Mark node as failed
    node.status = NodeStatus.FAILED;

    // If failed node was the leader, trigger election
    if (this.currentLeader === nodeId) {
      await this.electLeader();
    }

    // Consider automatic failover if enabled
    if (this.config.failover.enabled && this.config.failover.automaticFailover) {
      await this.executeFailover();
    }
  }

  private startConsensus(): void {
    // Start consensus algorithm (simplified)
    setInterval(() => {
      this.maintainConsensus();
    }, this.config.consensus.heartbeatInterval);
  }

  private stopConsensus(): void {
    // Stop consensus processing
  }

  private async maintainConsensus(): Promise<void> {
    // Simplified consensus maintenance
    if (!this.currentLeader || !this.nodes.has(this.currentLeader)) {
      await this.electLeader();
    }
  }

  private async electLeader(): Promise<void> {
    const healthyNodes = this.getHealthyNodes();

    if (healthyNodes.length === 0) {
      this.currentLeader = null;
      this.emitEvent({
        type: ClusterEventType.CONSENSUS_LOST,
        severity: 'critical',
        message: 'No healthy nodes available for leader election',
        metadata: {}
      });
      return;
    }

    // Simple leader election - choose node with highest priority
    const leader = healthyNodes.reduce((prev, current) => {
      const prevPriority = this.getNodePriority(prev);
      const currentPriority = this.getNodePriority(current);
      return currentPriority > prevPriority ? current : prev;
    });

    this.currentLeader = leader.id;

    this.emitEvent({
      type: ClusterEventType.LEADER_ELECTED,
      nodeId: leader.id,
      severity: 'info',
      message: `Node ${leader.id} elected as leader`,
      metadata: { role: leader.role, region: leader.region }
    });
  }

  private getNodePriority(node: ClusterNode): number {
    let priority = 0;

    // Role-based priority
    switch (node.role) {
      case NodeRole.PRIMARY: priority += 100; break;
      case NodeRole.SECONDARY: priority += 80; break;
      case NodeRole.WORKER: priority += 60; break;
      case NodeRole.OBSERVER: priority += 40; break;
    }

    // Health-based priority
    priority += node.health.score;

    // Resource-based priority
    priority += (100 - node.resources.cpu.usage);
    priority += (100 - node.resources.memory.usage);

    return priority;
  }

  private async executeFailover(targetNodeId?: string): Promise<boolean> {
    try {
      const targetNode = targetNodeId
        ? this.nodes.get(targetNodeId)
        : this.selectBestFailoverTarget();

      if (!targetNode) {
        throw new Error('No suitable failover target found');
      }

      // Perform failover operations
      this.currentLeader = targetNode.id;
      targetNode.role = NodeRole.PRIMARY;

      return true;
    } catch (error) {
      console.error('Failover failed:', error);
      return false;
    }
  }

  private selectBestFailoverTarget(): ClusterNode | null {
    const candidates = this.getHealthyNodes()
      .filter(node => node.id !== this.currentLeader);

    if (candidates.length === 0) return null;

    return candidates.reduce((best, current) =>
      this.getNodePriority(current) > this.getNodePriority(best) ? current : best
    );
  }

  private async scaleUp(count: number): Promise<boolean> {
    this.emitEvent({
      type: ClusterEventType.SCALING_UP,
      severity: 'info',
      message: `Scaling up cluster by ${count} nodes`,
      metadata: { count, targetSize: this.nodes.size + count }
    });

    // In a real implementation, this would trigger node provisioning
    return true;
  }

  private async scaleDown(count: number): Promise<boolean> {
    this.emitEvent({
      type: ClusterEventType.SCALING_DOWN,
      severity: 'info',
      message: `Scaling down cluster by ${count} nodes`,
      metadata: { count, targetSize: this.nodes.size - count }
    });

    // Select nodes to remove (prefer unhealthy or low-priority nodes)
    const nodesToRemove = this.selectNodesForRemoval(count);

    for (const node of nodesToRemove) {
      await this.removeNode(node.id);
    }

    return true;
  }

  private selectNodesForRemoval(count: number): ClusterNode[] {
    const nodes = Array.from(this.nodes.values())
      .filter(node => node.id !== this.localNodeId && node.id !== this.currentLeader)
      .sort((a, b) => this.getNodePriority(a) - this.getNodePriority(b));

    return nodes.slice(0, count);
  }

  private startMonitoring(): void {
    if (!this.config.monitoring.metricsEnabled) return;

    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute
  }

  private collectMetrics(): void {
    // Collect and emit cluster metrics
    const metrics = this.getClusterMetrics();
    this.emit('metricsCollected', metrics);
  }

  private getClusterMetrics(): ClusterMetrics {
    const nodes = Array.from(this.nodes.values());
    const healthyNodes = this.getHealthyNodes();
    const activeNodes = nodes.filter(node => node.status === NodeStatus.ACTIVE);

    // Aggregate resource utilization
    const totalCpu = nodes.reduce((sum, node) => sum + node.resources.cpu.usage, 0);
    const totalMemory = nodes.reduce((sum, node) => sum + node.resources.memory.usage, 0);
    const totalNetwork = nodes.reduce((sum, node) => sum + node.resources.network.throughput, 0);

    const avgCpu = nodes.length > 0 ? totalCpu / nodes.length : 0;
    const avgMemory = nodes.length > 0 ? totalMemory / nodes.length : 0;

    // Calculate uptime
    const localNode = this.getLocalNode();
    const uptime = Date.now() - localNode.joinedAt;

    // Calculate availability
    const availability = nodes.length > 0 ? (healthyNodes.length / nodes.length) * 100 : 0;

    return {
      nodeCount: nodes.length,
      healthyNodes: healthyNodes.length,
      activeNodes: activeNodes.length,
      totalRequests: 0, // Would be tracked separately
      requestsPerSecond: 0, // Would be calculated from request metrics
      averageLatency: 0, // Would be tracked from load balancer
      errorRate: 0, // Would be calculated from error metrics
      cpuUtilization: avgCpu,
      memoryUtilization: avgMemory,
      networkThroughput: totalNetwork,
      uptime,
      availability
    };
  }

  private hasConsensus(): boolean {
    const healthyNodes = this.getHealthyNodeCount();
    return healthyNodes >= this.config.consensus.quorumSize;
  }

  private getHealthyNodeCount(): number {
    return this.getHealthyNodes().length;
  }

  private getHealthyNodes(): ClusterNode[] {
    return Array.from(this.nodes.values())
      .filter(node => node.health.status === 'healthy' && node.status === NodeStatus.ACTIVE);
  }

  private getLocalNode(): ClusterNode {
    return this.nodes.get(this.localNodeId)!;
  }

  private getDefaultResources(): NodeResources {
    return {
      cpu: { cores: 4, usage: 20, loadAverage: [0.5, 0.3, 0.2] },
      memory: { total: 8 * 1024 * 1024 * 1024, used: 2 * 1024 * 1024 * 1024, available: 6 * 1024 * 1024 * 1024, usage: 25 },
      storage: { total: 100 * 1024 * 1024 * 1024, used: 20 * 1024 * 1024 * 1024, available: 80 * 1024 * 1024 * 1024, usage: 20 },
      network: { bandwidth: 1000 * 1024 * 1024, latency: 10, throughput: 1000 }
    };
  }

  private emitEvent(eventData: Omit<ClusterEvent, 'id' | 'timestamp'>): void {
    const event: ClusterEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...eventData
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    this.emit('clusterEvent', event);
  }

  private generateNodeId(): string {
    return `node_${  randomBytes(8).toString('hex')}`;
  }

  private generateEventId(): string {
    return `evt_${  randomBytes(8).toString('hex')}`;
  }
}

// Supporting classes

class ConsensusState {
  public term: number = 0;
  public votedFor: string | null = null;
  public log: any[] = [];
  public commitIndex: number = 0;
  public lastApplied: number = 0;
}

class LoadBalancer {
  constructor(private config: LoadBalancingConfig) {}

  selectNode(nodes: ClusterNode[], request?: any): ClusterNode | null {
    if (nodes.length === 0) return null;

    switch (this.config.algorithm) {
      case 'round-robin':
        return this.roundRobin(nodes);
      case 'least-connections':
        return this.leastConnections(nodes);
      case 'weighted':
        return this.weighted(nodes);
      case 'ip-hash':
        return this.ipHash(nodes, request);
      case 'least-response-time':
        return this.leastResponseTime(nodes);
      default:
        return nodes[0];
    }
  }

  addNode(node: ClusterNode): void {
    // Add node to load balancer
  }

  removeNode(nodeId: string): void {
    // Remove node from load balancer
  }

  private roundRobin(nodes: ClusterNode[]): ClusterNode {
    // Simplified round-robin implementation
    return nodes[Math.floor(Math.random() * nodes.length)];
  }

  private leastConnections(nodes: ClusterNode[]): ClusterNode {
    // Would select node with least active connections
    return nodes[0];
  }

  private weighted(nodes: ClusterNode[]): ClusterNode {
    // Would use configured weights
    return nodes[0];
  }

  private ipHash(nodes: ClusterNode[], request: any): ClusterNode {
    // Would hash request IP to consistent node
    return nodes[0];
  }

  private leastResponseTime(nodes: ClusterNode[]): ClusterNode {
    // Would select node with lowest response time
    return nodes[0];
  }
}

class AutoScaler {
  private running: boolean = false;
  private lastScaleAction: number = 0;

  constructor(
    private config: AutoScalingConfig,
    private clusterManager: ClusterManager
  ) {}

  start(): void {
    if (!this.config.enabled) return;

    this.running = true;
    this.scheduleScalingCheck();
  }

  stop(): void {
    this.running = false;
  }

  private scheduleScalingCheck(): void {
    if (!this.running) return;

    setTimeout(() => {
      this.checkScaling();
      this.scheduleScalingCheck();
    }, 60000); // Check every minute
  }

  private async checkScaling(): Promise<void> {
    const now = Date.now();

    // Check cooldown period
    if (now - this.lastScaleAction < this.config.cooldownPeriod) {
      return;
    }

    const metrics = this.clusterManager.getClusterStatus().metrics;
    const currentSize = metrics.nodeCount;

    // Check scale up conditions
    if (this.shouldScaleUp(metrics, currentSize)) {
      const targetSize = Math.min(currentSize + 1, this.config.maxReplicas);
      await this.clusterManager.scaleCluster(targetSize);
      this.lastScaleAction = now;
    }
    // Check scale down conditions
    else if (this.shouldScaleDown(metrics, currentSize)) {
      const targetSize = Math.max(currentSize - 1, this.config.minReplicas);
      await this.clusterManager.scaleCluster(targetSize);
      this.lastScaleAction = now;
    }
  }

  private shouldScaleUp(metrics: ClusterMetrics, currentSize: number): boolean {
    return currentSize < this.config.maxReplicas &&
           (metrics.cpuUtilization > this.config.scaleUpThreshold ||
            metrics.memoryUtilization > this.config.scaleUpThreshold);
  }

  private shouldScaleDown(metrics: ClusterMetrics, currentSize: number): boolean {
    return currentSize > this.config.minReplicas &&
           metrics.cpuUtilization < this.config.scaleDownThreshold &&
           metrics.memoryUtilization < this.config.scaleDownThreshold;
  }
}

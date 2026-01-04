/**
 * Service Discovery and Coordination for ATP Clusters
 * Distributed service registry and coordination primitives
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';

export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  address: string;
  port: number;
  protocol: 'http' | 'https' | 'tcp' | 'grpc';
  metadata: Record<string, any>;
  tags: string[];
  health: ServiceHealth;
  registeredAt: number;
  lastHeartbeat: number;
  ttl: number; // Time to live in milliseconds
}

export interface ServiceHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  checks: ServiceHealthCheck[];
  lastCheck: number;
  consecutiveFailures: number;
}

export interface ServiceHealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'script' | 'ttl';
  interval: number;
  timeout: number;
  http?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    expectedStatus: number;
  };
  tcp?: {
    host: string;
    port: number;
  };
  script?: {
    command: string;
    args: string[];
  };
  status: 'pass' | 'warn' | 'fail';
  output: string;
  lastRun: number;
}

export interface ServiceQuery {
  serviceName?: string;
  tags?: string[];
  healthy?: boolean;
  region?: string;
  datacenter?: string;
  metadata?: Record<string, any>;
}

export interface CoordinationPrimitive {
  id: string;
  type: 'lock' | 'semaphore' | 'barrier' | 'queue' | 'election';
  name: string;
  owner?: string;
  value?: any;
  createdAt: number;
  expiresAt?: number;
  metadata: Record<string, any>;
}

export interface DistributedLock extends CoordinationPrimitive {
  type: 'lock';
  acquired: boolean;
  acquiredBy?: string;
  acquiredAt?: number;
  ttl: number;
}

export interface DistributedSemaphore extends CoordinationPrimitive {
  type: 'semaphore';
  capacity: number;
  available: number;
  holders: Array<{
    id: string;
    acquiredAt: number;
    ttl: number;
  }>;
}

export interface DistributedBarrier extends CoordinationPrimitive {
  type: 'barrier';
  requiredParticipants: number;
  currentParticipants: string[];
  released: boolean;
  releasedAt?: number;
}

export interface DistributedQueue extends CoordinationPrimitive {
  type: 'queue';
  items: QueueItem[];
  maxSize?: number;
  fifo: boolean;
}

export interface QueueItem {
  id: string;
  data: any;
  priority: number;
  enqueuedAt: number;
  dequeueAttempts: number;
  maxRetries: number;
  ttl?: number;
}

export interface LeaderElection extends CoordinationPrimitive {
  type: 'election';
  currentLeader?: string;
  candidates: Array<{
    id: string;
    registeredAt: number;
    priority: number;
    metadata: Record<string, any>;
  }>;
  term: number;
  electionTimeout: number;
}

export class ServiceDiscoveryManager extends EventEmitter {
  private services: Map<string, Map<string, ServiceInstance>> = new Map();
  private coordination: Map<string, CoordinationPrimitive> = new Map();
  private watchers: Map<string, Set<(event: ServiceEvent) => void>> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;

  constructor() {
    super();
  }

  /**
   * Start the service discovery manager
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.startHealthChecks();
    this.startCleanup();

    this.emit('serviceDiscoveryStarted', { timestamp: Date.now() });
  }

  /**
   * Stop the service discovery manager
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.stopHealthChecks();

    this.emit('serviceDiscoveryStopped', { timestamp: Date.now() });
  }

  /**
   * Register a service instance
   */
  async registerService(instance: Omit<ServiceInstance, 'id' | 'registeredAt' | 'lastHeartbeat'>): Promise<ServiceInstance> {
    const serviceInstance: ServiceInstance = {
      ...instance,
      id: this.generateInstanceId(),
      registeredAt: Date.now(),
      lastHeartbeat: Date.now()
    };

    // Initialize service map if not exists
    if (!this.services.has(instance.name)) {
      this.services.set(instance.name, new Map());
    }

    const serviceMap = this.services.get(instance.name)!;
    serviceMap.set(serviceInstance.id, serviceInstance);

    // Start health checks for this instance
    this.startInstanceHealthChecks(serviceInstance);

    // Notify watchers
    this.notifyWatchers(instance.name, {
      type: 'service-registered',
      serviceName: instance.name,
      instanceId: serviceInstance.id,
      instance: serviceInstance,
      timestamp: Date.now()
    });

    this.emit('serviceRegistered', {
      serviceName: instance.name,
      instanceId: serviceInstance.id,
      instance: serviceInstance
    });

    return serviceInstance;
  }

  /**
   * Deregister a service instance
   */
  async deregisterService(serviceName: string, instanceId: string): Promise<boolean> {
    const serviceMap = this.services.get(serviceName);
    if (!serviceMap) return false;

    const instance = serviceMap.get(instanceId);
    if (!instance) return false;

    serviceMap.delete(instanceId);

    // Clean up empty service maps
    if (serviceMap.size === 0) {
      this.services.delete(serviceName);
    }

    // Stop health checks
    this.stopInstanceHealthChecks(instanceId);

    // Notify watchers
    this.notifyWatchers(serviceName, {
      type: 'service-deregistered',
      serviceName,
      instanceId,
      instance,
      timestamp: Date.now()
    });

    this.emit('serviceDeregistered', {
      serviceName,
      instanceId,
      instance
    });

    return true;
  }

  /**
   * Discover services matching query
   */
  discoverServices(query: ServiceQuery = {}): ServiceInstance[] {
    const results: ServiceInstance[] = [];

    for (const [serviceName, instanceMap] of this.services) {
      // Filter by service name
      if (query.serviceName && serviceName !== query.serviceName) {
        continue;
      }

      for (const instance of instanceMap.values()) {
        // Filter by health status
        if (query.healthy !== undefined) {
          const isHealthy = instance.health.status === 'healthy';
          if (query.healthy !== isHealthy) continue;
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
          const hasAllTags = query.tags.every(tag => instance.tags.includes(tag));
          if (!hasAllTags) continue;
        }

        // Filter by metadata
        if (query.metadata) {
          const hasAllMetadata = Object.entries(query.metadata).every(
            ([key, value]) => instance.metadata[key] === value
          );
          if (!hasAllMetadata) continue;
        }

        results.push(instance);
      }
    }

    return results;
  }

  /**
   * Watch for service changes
   */
  watchService(serviceName: string, callback: (event: ServiceEvent) => void): () => void {
    if (!this.watchers.has(serviceName)) {
      this.watchers.set(serviceName, new Set());
    }

    this.watchers.get(serviceName)!.add(callback);

    // Return unwatch function
    return () => {
      const watcherSet = this.watchers.get(serviceName);
      if (watcherSet) {
        watcherSet.delete(callback);
        if (watcherSet.size === 0) {
          this.watchers.delete(serviceName);
        }
      }
    };
  }

  /**
   * Update service heartbeat
   */
  async heartbeat(serviceName: string, instanceId: string): Promise<boolean> {
    const serviceMap = this.services.get(serviceName);
    if (!serviceMap) return false;

    const instance = serviceMap.get(instanceId);
    if (!instance) return false;

    instance.lastHeartbeat = Date.now();
    return true;
  }

  /**
   * Create a distributed lock
   */
  async createLock(name: string, ttl: number = 30000): Promise<DistributedLock> {
    const lock: DistributedLock = {
      id: this.generateCoordinationId(),
      type: 'lock',
      name,
      acquired: false,
      ttl,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      metadata: {}
    };

    this.coordination.set(lock.id, lock);

    this.emit('lockCreated', { lockId: lock.id, name });
    return lock;
  }

  /**
   * Acquire a distributed lock
   */
  async acquireLock(lockId: string, ownerId: string, ttl?: number): Promise<boolean> {
    const primitive = this.coordination.get(lockId);
    if (!primitive || primitive.type !== 'lock') return false;

    const lock = primitive as DistributedLock;

    // Check if lock is already acquired and not expired
    if (lock.acquired && lock.expiresAt && Date.now() < lock.expiresAt) {
      return false;
    }

    // Acquire the lock
    lock.acquired = true;
    lock.acquiredBy = ownerId;
    lock.acquiredAt = Date.now();
    lock.expiresAt = Date.now() + (ttl || lock.ttl);

    this.emit('lockAcquired', { lockId, ownerId });
    return true;
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lockId: string, ownerId: string): Promise<boolean> {
    const primitive = this.coordination.get(lockId);
    if (!primitive || primitive.type !== 'lock') return false;

    const lock = primitive as DistributedLock;

    // Verify ownership
    if (lock.acquiredBy !== ownerId) return false;

    // Release the lock
    lock.acquired = false;
    lock.acquiredBy = undefined;
    lock.acquiredAt = undefined;
    lock.expiresAt = undefined;

    this.emit('lockReleased', { lockId, ownerId });
    return true;
  }

  /**
   * Create a distributed semaphore
   */
  async createSemaphore(name: string, capacity: number): Promise<DistributedSemaphore> {
    const semaphore: DistributedSemaphore = {
      id: this.generateCoordinationId(),
      type: 'semaphore',
      name,
      capacity,
      available: capacity,
      holders: [],
      createdAt: Date.now(),
      metadata: {}
    };

    this.coordination.set(semaphore.id, semaphore);

    this.emit('semaphoreCreated', { semaphoreId: semaphore.id, name, capacity });
    return semaphore;
  }

  /**
   * Acquire semaphore permit
   */
  async acquirePermit(semaphoreId: string, holderId: string, ttl: number = 30000): Promise<boolean> {
    const primitive = this.coordination.get(semaphoreId);
    if (!primitive || primitive.type !== 'semaphore') return false;

    const semaphore = primitive as DistributedSemaphore;

    // Clean up expired permits
    this.cleanupExpiredPermits(semaphore);

    // Check availability
    if (semaphore.available <= 0) return false;

    // Acquire permit
    semaphore.holders.push({
      id: holderId,
      acquiredAt: Date.now(),
      ttl
    });
    semaphore.available--;

    this.emit('permitAcquired', { semaphoreId, holderId });
    return true;
  }

  /**
   * Release semaphore permit
   */
  async releasePermit(semaphoreId: string, holderId: string): Promise<boolean> {
    const primitive = this.coordination.get(semaphoreId);
    if (!primitive || primitive.type !== 'semaphore') return false;

    const semaphore = primitive as DistributedSemaphore;

    const holderIndex = semaphore.holders.findIndex(h => h.id === holderId);
    if (holderIndex === -1) return false;

    semaphore.holders.splice(holderIndex, 1);
    semaphore.available++;

    this.emit('permitReleased', { semaphoreId, holderId });
    return true;
  }

  /**
   * Create a distributed barrier
   */
  async createBarrier(name: string, requiredParticipants: number): Promise<DistributedBarrier> {
    const barrier: DistributedBarrier = {
      id: this.generateCoordinationId(),
      type: 'barrier',
      name,
      requiredParticipants,
      currentParticipants: [],
      released: false,
      createdAt: Date.now(),
      metadata: {}
    };

    this.coordination.set(barrier.id, barrier);

    this.emit('barrierCreated', { barrierId: barrier.id, name, requiredParticipants });
    return barrier;
  }

  /**
   * Join a distributed barrier
   */
  async joinBarrier(barrierId: string, participantId: string): Promise<boolean> {
    const primitive = this.coordination.get(barrierId);
    if (!primitive || primitive.type !== 'barrier') return false;

    const barrier = primitive as DistributedBarrier;

    // Check if already joined
    if (barrier.currentParticipants.includes(participantId)) return true;

    // Join barrier
    barrier.currentParticipants.push(participantId);

    // Check if barrier should be released
    if (barrier.currentParticipants.length >= barrier.requiredParticipants) {
      barrier.released = true;
      barrier.releasedAt = Date.now();

      this.emit('barrierReleased', {
        barrierId,
        participants: barrier.currentParticipants,
        releasedAt: barrier.releasedAt
      });
    }

    this.emit('barrierJoined', { barrierId, participantId });
    return barrier.released;
  }

  /**
   * Create a distributed queue
   */
  async createQueue(name: string, maxSize?: number, fifo: boolean = true): Promise<DistributedQueue> {
    const queue: DistributedQueue = {
      id: this.generateCoordinationId(),
      type: 'queue',
      name,
      items: [],
      maxSize,
      fifo,
      createdAt: Date.now(),
      metadata: {}
    };

    this.coordination.set(queue.id, queue);

    this.emit('queueCreated', { queueId: queue.id, name, maxSize, fifo });
    return queue;
  }

  /**
   * Enqueue item
   */
  async enqueue(queueId: string, data: any, priority: number = 0, ttl?: number): Promise<boolean> {
    const primitive = this.coordination.get(queueId);
    if (!primitive || primitive.type !== 'queue') return false;

    const queue = primitive as DistributedQueue;

    // Check size limit
    if (queue.maxSize && queue.items.length >= queue.maxSize) {
      return false;
    }

    const item: QueueItem = {
      id: this.generateItemId(),
      data,
      priority,
      enqueuedAt: Date.now(),
      dequeueAttempts: 0,
      maxRetries: 3,
      ttl
    };

    queue.items.push(item);

    // Sort by priority if not FIFO
    if (!queue.fifo) {
      queue.items.sort((a, b) => b.priority - a.priority);
    }

    this.emit('itemEnqueued', { queueId, itemId: item.id, data, priority });
    return true;
  }

  /**
   * Dequeue item
   */
  async dequeue(queueId: string): Promise<QueueItem | null> {
    const primitive = this.coordination.get(queueId);
    if (!primitive || primitive.type !== 'queue') return null;

    const queue = primitive as DistributedQueue;

    // Clean up expired items
    this.cleanupExpiredQueueItems(queue);

    if (queue.items.length === 0) return null;

    const item = queue.items.shift()!;
    item.dequeueAttempts++;

    this.emit('itemDequeued', { queueId, itemId: item.id, data: item.data });
    return item;
  }

  /**
   * Create leader election
   */
  async createLeaderElection(name: string, electionTimeout: number = 30000): Promise<LeaderElection> {
    const election: LeaderElection = {
      id: this.generateCoordinationId(),
      type: 'election',
      name,
      candidates: [],
      term: 0,
      electionTimeout,
      createdAt: Date.now(),
      metadata: {}
    };

    this.coordination.set(election.id, election);

    this.emit('electionCreated', { electionId: election.id, name });
    return election;
  }

  /**
   * Register as leader candidate
   */
  async registerCandidate(
    electionId: string,
    candidateId: string,
    priority: number = 0,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    const primitive = this.coordination.get(electionId);
    if (!primitive || primitive.type !== 'election') return false;

    const election = primitive as LeaderElection;

    // Check if already registered
    const existingCandidate = election.candidates.find(c => c.id === candidateId);
    if (existingCandidate) {
      existingCandidate.priority = priority;
      existingCandidate.metadata = metadata;
    } else {
      election.candidates.push({
        id: candidateId,
        registeredAt: Date.now(),
        priority,
        metadata
      });
    }

    // Trigger leader selection
    this.selectLeader(election);

    this.emit('candidateRegistered', { electionId, candidateId, priority });
    return true;
  }

  /**
   * Get current leader
   */
  getLeader(electionId: string): string | null {
    const primitive = this.coordination.get(electionId);
    if (!primitive || primitive.type !== 'election') return null;

    const election = primitive as LeaderElection;
    return election.currentLeader || null;
  }

  /**
   * Get all coordination primitives
   */
  getCoordinationPrimitives(): CoordinationPrimitive[] {
    return Array.from(this.coordination.values());
  }

  /**
   * Get service registry stats
   */
  getRegistryStats(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    coordinationPrimitives: number;
    watchers: number;
    } {
    let totalInstances = 0;
    let healthyInstances = 0;

    for (const instanceMap of this.services.values()) {
      totalInstances += instanceMap.size;
      for (const instance of instanceMap.values()) {
        if (instance.health.status === 'healthy') {
          healthyInstances++;
        }
      }
    }

    let totalWatchers = 0;
    for (const watcherSet of this.watchers.values()) {
      totalWatchers += watcherSet.size;
    }

    return {
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      coordinationPrimitives: this.coordination.size,
      watchers: totalWatchers
    };
  }

  // Private methods

  private startHealthChecks(): void {
    setInterval(() => {
      if (this.running) {
        this.performHealthChecks();
      }
    }, 30000); // Every 30 seconds
  }

  private stopHealthChecks(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }

  private startInstanceHealthChecks(instance: ServiceInstance): void {
    const interval = setInterval(() => {
      this.performInstanceHealthCheck(instance);
    }, 10000); // Every 10 seconds

    this.healthCheckIntervals.set(instance.id, interval);
  }

  private stopInstanceHealthChecks(instanceId: string): void {
    const interval = this.healthCheckIntervals.get(instanceId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(instanceId);
    }
  }

  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, instanceMap] of this.services) {
      for (const instance of instanceMap.values()) {
        await this.performInstanceHealthCheck(instance);
      }
    }

    // Cleanup expired instances
    this.cleanupExpiredInstances();

    // Cleanup expired coordination primitives
    this.cleanupExpiredCoordination();
  }

  private async performInstanceHealthCheck(instance: ServiceInstance): Promise<void> {
    let healthy = true;
    const now = Date.now();

    // Check TTL expiry
    if (now - instance.lastHeartbeat > instance.ttl) {
      healthy = false;
      instance.health.status = 'critical';
      instance.health.consecutiveFailures++;
    } else {
      // Perform configured health checks
      for (const check of instance.health.checks) {
        try {
          const passed = await this.executeHealthCheck(instance, check);
          check.status = passed ? 'pass' : 'fail';
          check.lastRun = now;

          if (!passed) {
            healthy = false;
          }
        } catch (error) {
          check.status = 'fail';
          check.output = error instanceof Error ? error.message : String(error);
          check.lastRun = now;
          healthy = false;
        }
      }

      if (healthy) {
        instance.health.status = 'healthy';
        instance.health.consecutiveFailures = 0;
      } else {
        instance.health.status = 'critical';
        instance.health.consecutiveFailures++;
      }
    }

    instance.health.lastCheck = now;

    // Notify watchers of health changes
    this.notifyWatchers(instance.name, {
      type: 'health-changed',
      serviceName: instance.name,
      instanceId: instance.id,
      instance,
      timestamp: now
    });
  }

  private async executeHealthCheck(instance: ServiceInstance, check: ServiceHealthCheck): Promise<boolean> {
    switch (check.type) {
      case 'http':
        return await this.executeHttpHealthCheck(check);
      case 'tcp':
        return await this.executeTcpHealthCheck(check);
      case 'script':
        return await this.executeScriptHealthCheck(check);
      case 'ttl':
        return true; // TTL checks are handled separately
      default:
        return false;
    }
  }

  private async executeHttpHealthCheck(check: ServiceHealthCheck): Promise<boolean> {
    // Simplified HTTP health check implementation
    return true; // Would make actual HTTP request
  }

  private async executeTcpHealthCheck(check: ServiceHealthCheck): Promise<boolean> {
    // Simplified TCP health check implementation
    return true; // Would test TCP connection
  }

  private async executeScriptHealthCheck(check: ServiceHealthCheck): Promise<boolean> {
    // Simplified script health check implementation
    return true; // Would execute script
  }

  private cleanupExpiredInstances(): void {
    const now = Date.now();

    for (const [serviceName, instanceMap] of this.services) {
      const expiredInstances: string[] = [];

      for (const [instanceId, instance] of instanceMap) {
        if (now - instance.lastHeartbeat > instance.ttl * 2) {
          expiredInstances.push(instanceId);
        }
      }

      for (const instanceId of expiredInstances) {
        this.deregisterService(serviceName, instanceId);
      }
    }
  }

  private cleanupExpiredCoordination(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, primitive] of this.coordination) {
      if (primitive.expiresAt && now > primitive.expiresAt) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      this.coordination.delete(id);
      this.emit('coordinationExpired', { primitiveId: id });
    }
  }

  private cleanupExpiredPermits(semaphore: DistributedSemaphore): void {
    const now = Date.now();
    const expiredCount = semaphore.holders.length;

    semaphore.holders = semaphore.holders.filter(holder =>
      now - holder.acquiredAt <= holder.ttl
    );

    const removedCount = expiredCount - semaphore.holders.length;
    semaphore.available += removedCount;
  }

  private cleanupExpiredQueueItems(queue: DistributedQueue): void {
    const now = Date.now();

    queue.items = queue.items.filter(item =>
      !item.ttl || now - item.enqueuedAt <= item.ttl
    );
  }

  private selectLeader(election: LeaderElection): void {
    if (election.candidates.length === 0) {
      election.currentLeader = undefined;
      return;
    }

    // Select candidate with highest priority (or first registered if tied)
    const leader = election.candidates.reduce((best, current) => {
      if (current.priority > best.priority) return current;
      if (current.priority === best.priority && current.registeredAt < best.registeredAt) return current;
      return best;
    });

    if (election.currentLeader !== leader.id) {
      election.currentLeader = leader.id;
      election.term++;

      this.emit('leaderElected', {
        electionId: election.id,
        leaderId: leader.id,
        term: election.term
      });
    }
  }

  private notifyWatchers(serviceName: string, event: ServiceEvent): void {
    const watchers = this.watchers.get(serviceName);
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(event);
        } catch (error: any) {
          this.emit('watcherError', { serviceName, error: error?.message || String(error) });
        }
      }
    }
  }

  private startCleanup(): void {
    setInterval(() => {
      if (this.running) {
        this.cleanupExpiredInstances();
        this.cleanupExpiredCoordination();
      }
    }, 60000); // Every minute
  }

  private generateInstanceId(): string {
    return `inst_${  randomBytes(8).toString('hex')}`;
  }

  private generateCoordinationId(): string {
    return `coord_${  randomBytes(8).toString('hex')}`;
  }

  private generateItemId(): string {
    return `item_${  randomBytes(8).toString('hex')}`;
  }
}

// Event interfaces
export interface ServiceEvent {
  type: 'service-registered' | 'service-deregistered' | 'health-changed';
  serviceName: string;
  instanceId: string;
  instance: ServiceInstance;
  timestamp: number;
}

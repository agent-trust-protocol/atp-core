/**
 * High-Availability Clustering System
 * Enterprise-grade clustering with load balancing, failover, and service discovery
 */

export {
  ClusterManager,
  NodeRole,
  NodeStatus,
  ClusterTopology,
  ClusterNode,
  NodeResources,
  NodeHealth,
  HealthCheck,
  ClusterConfiguration,
  AutoScalingConfig,
  LoadBalancingConfig,
  FailoverConfig,
  ConsensusConfig,
  ClusterSecurityConfig,
  ClusterMonitoringConfig,
  ClusterEvent,
  ClusterEventType,
  ClusterMetrics
} from './cluster-manager';

export {
  ServiceDiscoveryManager,
  ServiceInstance,
  ServiceHealth,
  ServiceHealthCheck,
  ServiceQuery,
  CoordinationPrimitive,
  DistributedLock,
  DistributedSemaphore,
  DistributedBarrier,
  DistributedQueue,
  QueueItem,
  LeaderElection,
  ServiceEvent
} from './service-discovery';

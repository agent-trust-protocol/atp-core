/**
 * Observability Types
 */

export interface BehaviorMetrics {
  /** Agent DID */
  agentDid: string;
  
  /** Total actions performed */
  totalActions: number;
  
  /** Successful actions */
  successfulActions: number;
  
  /** Failed actions */
  failedActions: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Average execution time (ms) */
  avgExecutionTime: number;
  
  /** Error rate (0-1) */
  errorRate: number;
  
  /** Tool usage stats */
  toolUsage: Record<string, number>;
  
  /** Policy violations */
  policyViolations: number;
  
  /** Recent anomalies */
  anomalies: Array<{
    type: string;
    severity: number;
    timestamp: Date;
    description: string;
  }>;
}

export interface AnomalyDetection {
  /** Anomaly detected */
  detected: boolean;
  
  /** Anomaly score (0-1) */
  score: number;
  
  /** Anomaly type */
  type?: 'rate' | 'error' | 'latency' | 'pattern' | 'security';
  
  /** Description */
  description?: string;
  
  /** Recommended action */
  recommendedAction?: 'monitor' | 'alert' | 'block' | 'investigate';
  
  /** Trust impact */
  trustImpact?: number;
}

export interface LunaryMetrics {
  /** Agent/model identifier */
  agent: string;
  
  /** Total requests */
  requests: number;
  
  /** Error count */
  errors: number;
  
  /** Average latency (ms) */
  latency: number;
  
  /** Token usage */
  tokens?: number;
  
  /** Cost */
  cost?: number;
  
  /** Time period */
  period: {
    start: Date;
    end: Date;
  };
}

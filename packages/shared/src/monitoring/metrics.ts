/**
 * ATP™ Monitoring and Metrics Service
 * Comprehensive monitoring for production deployments
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  responseTime: number;
  details?: any;
  error?: string;
}

export class ATPMetricsService {
  private metrics: Map<string, MetricData[]> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private startTime: number = Date.now();

  constructor(private serviceName: string) {}

  // Record a metric
  recordMetric(name: string, value: number, type: MetricData['type'] = 'gauge', labels?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      type
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 entries per metric
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    // Log important metrics
    if (type === 'counter' || value > 0) {
      console.log(`📊 [${this.serviceName}] ${name}: ${value}${labels ? ` (${JSON.stringify(labels)})` : ''}`);
    }
  }

  // Increment a counter
  incrementCounter(name: string, labels?: Record<string, string>) {
    const current = this.getLatestMetric(name)?.value || 0;
    this.recordMetric(name, current + 1, 'counter', labels);
  }

  // Record response time
  recordResponseTime(endpoint: string, duration: number) {
    this.recordMetric('http_request_duration_ms', duration, 'histogram', { endpoint });
    this.recordMetric('http_requests_total', 1, 'counter', { endpoint });
  }

  // Record error
  recordError(type: string, error: Error) {
    this.recordMetric('errors_total', 1, 'counter', { type, message: error.message });
    console.error(`❌ [${this.serviceName}] Error (${type}):`, error);
  }

  // Health check
  async performHealthCheck(checkName: string, checkFn: () => Promise<any>): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        checkFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
      ]);

      const healthResult: HealthCheckResult = {
        service: checkName,
        status: 'healthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: result
      };

      this.healthChecks.set(checkName, healthResult);
      this.recordMetric('health_check_duration_ms', healthResult.responseTime, 'histogram', { service: checkName });

      return healthResult;
    } catch (error) {
      const healthResult: HealthCheckResult = {
        service: checkName,
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };

      this.healthChecks.set(checkName, healthResult);
      this.recordError('health_check', error instanceof Error ? error : new Error(String(error)));

      return healthResult;
    }
  }

  // Get system metrics
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    return {
      service: this.serviceName,
      uptime_ms: uptime,
      memory_used_bytes: memUsage.heapUsed,
      memory_total_bytes: memUsage.heapTotal,
      memory_external_bytes: memUsage.external,
      cpu_usage_percent: process.cpuUsage(),
      timestamp: Date.now()
    };
  }

  // Get latest metric value
  getLatestMetric(name: string): MetricData | undefined {
    const history = this.metrics.get(name);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  // Get all metrics for Prometheus export
  getPrometheusMetrics(): string {
    let output = '';

    for (const [name, history] of this.metrics.entries()) {
      if (history.length === 0) continue;

      const latest = history[history.length - 1];
      const metricName = `atp_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

      output += `# HELP ${metricName} ATP ${this.serviceName} metric\n`;
      output += `# TYPE ${metricName} ${latest.type}\n`;

      const labels = latest.labels ?
        Object.entries(latest.labels).map(([k, v]) => `${k}="${v}"`).join(',') : '';

      output += `${metricName}${labels ? `{${labels}}` : ''} ${latest.value} ${latest.timestamp}\n`;
    }

    // Add system metrics
    const sysMetrics = this.getSystemMetrics();
    output += '# HELP atp_uptime_seconds Service uptime in seconds\n';
    output += '# TYPE atp_uptime_seconds gauge\n';
    output += `atp_uptime_seconds{service="${this.serviceName}"} ${sysMetrics.uptime_ms / 1000}\n`;

    output += '# HELP atp_memory_used_bytes Memory usage in bytes\n';
    output += '# TYPE atp_memory_used_bytes gauge\n';
    output += `atp_memory_used_bytes{service="${this.serviceName}"} ${sysMetrics.memory_used_bytes}\n`;

    return output;
  }

  // Get health status
  getHealthStatus() {
    const checks = Array.from(this.healthChecks.values());
    const overallStatus = checks.every(c => c.status === 'healthy') ? 'healthy' :
      checks.some(c => c.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    return {
      service: this.serviceName,
      status: overallStatus,
      timestamp: Date.now(),
      checks: Object.fromEntries(this.healthChecks.entries()),
      system: this.getSystemMetrics()
    };
  }

  // Start periodic system metrics collection
  startSystemMetricsCollection(intervalMs: number = 30000) {
    setInterval(() => {
      const metrics = this.getSystemMetrics();
      this.recordMetric('uptime_ms', metrics.uptime_ms);
      this.recordMetric('memory_used_bytes', metrics.memory_used_bytes);
      this.recordMetric('memory_total_bytes', metrics.memory_total_bytes);
    }, intervalMs);
  }
}

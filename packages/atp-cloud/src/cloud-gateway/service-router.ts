/**
 * ATP Cloud Service Router
 * Intelligent routing and load balancing for ATP services
 */

import { Request } from 'express';
import { config } from '../shared/config.js';
import { createServiceLogger } from '../shared/logger.js';
import { AuthenticatedRequest } from '../shared/auth.js';

const logger = createServiceLogger('service-router');

export interface ServiceEndpoint {
  url: string;
  port: number;
  replicas: number;
  healthy: boolean;
  lastCheck: Date;
  responseTime: number;
}

export class ServiceRouter {
  private serviceEndpoints: Map<string, ServiceEndpoint[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private currentReplicas: Map<string, number> = new Map();

  constructor() {
    this.initializeServices();
    this.startHealthChecks();
  }

  /**
   * Initialize service endpoints from configuration
   */
  private initializeServices(): void {
    const cloudConfig = config.getConfig();

    // Initialize each service with its replicas
    Object.entries(cloudConfig.services).forEach(([serviceName, serviceConfig]) => {
      const endpoints: ServiceEndpoint[] = [];
      
      for (let i = 0; i < serviceConfig.replicas; i++) {
        endpoints.push({
          url: serviceConfig.url,
          port: serviceConfig.port + i, // Increment port for each replica
          replicas: serviceConfig.replicas,
          healthy: true,
          lastCheck: new Date(),
          responseTime: 0
        });
      }

      this.serviceEndpoints.set(serviceName, endpoints);
      this.currentReplicas.set(serviceName, 0);

      logger.debug('Service initialized', {
        service: serviceName,
        replicas: serviceConfig.replicas,
        baseUrl: serviceConfig.url
      });
    });
  }

  /**
   * Get the best available endpoint for a service
   */
  public getServiceEndpoint(serviceName: string, req?: AuthenticatedRequest): ServiceEndpoint | null {
    const endpoints = this.serviceEndpoints.get(serviceName);
    if (!endpoints || endpoints.length === 0) {
      logger.error('Service not found', { service: serviceName });
      return null;
    }

    // Filter healthy endpoints
    const healthyEndpoints = endpoints.filter(endpoint => endpoint.healthy);
    if (healthyEndpoints.length === 0) {
      logger.error('No healthy endpoints available', { service: serviceName });
      // Return an unhealthy endpoint as fallback
      return endpoints[0];
    }

    // Round-robin load balancing
    const currentIndex = this.currentReplicas.get(serviceName) || 0;
    const nextIndex = (currentIndex + 1) % healthyEndpoints.length;
    this.currentReplicas.set(serviceName, nextIndex);

    const selectedEndpoint = healthyEndpoints[nextIndex];
    
    logger.debug('Service endpoint selected', {
      service: serviceName,
      endpoint: `${selectedEndpoint.url}:${selectedEndpoint.port}`,
      replica: nextIndex,
      healthy: selectedEndpoint.healthy,
      responseTime: selectedEndpoint.responseTime
    });

    return selectedEndpoint;
  }

  /**
   * Get service endpoint optimized for tenant plan
   */
  public getTenantOptimizedEndpoint(serviceName: string, req: AuthenticatedRequest): ServiceEndpoint | null {
    if (!req.tenant) {
      return this.getServiceEndpoint(serviceName, req);
    }

    const endpoints = this.serviceEndpoints.get(serviceName);
    if (!endpoints) {
      return null;
    }

    // Premium plans get priority routing to fastest endpoints
    if (req.tenant.plan === 'enterprise' || req.tenant.plan === 'professional') {
      const healthyEndpoints = endpoints
        .filter(endpoint => endpoint.healthy)
        .sort((a, b) => a.responseTime - b.responseTime);

      if (healthyEndpoints.length > 0) {
        return healthyEndpoints[0]; // Fastest endpoint
      }
    }

    // Default routing for free/starter plans
    return this.getServiceEndpoint(serviceName, req);
  }

  /**
   * Start periodic health checks for all services
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds

    // Immediate health check
    this.performHealthChecks();
  }

  /**
   * Perform health checks on all service endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [serviceName, endpoints] of this.serviceEndpoints.entries()) {
      for (const endpoint of endpoints) {
        promises.push(this.checkEndpointHealth(serviceName, endpoint));
      }
    }

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Health check batch failed', { error });
    }
  }

  /**
   * Check health of a specific endpoint
   */
  private async checkEndpointHealth(serviceName: string, endpoint: ServiceEndpoint): Promise<void> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${endpoint.url.replace(/:\d+$/, '')}:${endpoint.port}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ATP-Cloud-HealthCheck/1.0'
        }
      });
      
      clearTimeout(timeoutId);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        endpoint.healthy = true;
        endpoint.responseTime = responseTime;
        endpoint.lastCheck = new Date();

        logger.debug('Health check passed', {
          service: serviceName,
          endpoint: `${endpoint.url}:${endpoint.port}`,
          responseTime
        });
      } else {
        endpoint.healthy = false;
        endpoint.lastCheck = new Date();

        logger.warn('Health check failed - bad response', {
          service: serviceName,
          endpoint: `${endpoint.url}:${endpoint.port}`,
          status: response.status
        });
      }
    } catch (error: any) {
      endpoint.healthy = false;
      endpoint.lastCheck = new Date();

      logger.warn('Health check failed - error', {
        service: serviceName,
        endpoint: `${endpoint.url}:${endpoint.port}`,
        error: error.message
      });
    }
  }

  /**
   * Get service health summary
   */
  public getServiceHealth(): Record<string, {
    totalReplicas: number;
    healthyReplicas: number;
    averageResponseTime: number;
    status: 'healthy' | 'degraded' | 'down';
  }> {
    const healthSummary: Record<string, any> = {};

    for (const [serviceName, endpoints] of this.serviceEndpoints.entries()) {
      const healthyEndpoints = endpoints.filter(e => e.healthy);
      const averageResponseTime = healthyEndpoints.length > 0
        ? healthyEndpoints.reduce((sum, e) => sum + e.responseTime, 0) / healthyEndpoints.length
        : 0;

      let status: 'healthy' | 'degraded' | 'down';
      if (healthyEndpoints.length === 0) {
        status = 'down';
      } else if (healthyEndpoints.length < endpoints.length) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      healthSummary[serviceName] = {
        totalReplicas: endpoints.length,
        healthyReplicas: healthyEndpoints.length,
        averageResponseTime: Math.round(averageResponseTime),
        status
      };
    }

    return healthSummary;
  }

  /**
   * Manually mark an endpoint as unhealthy
   */
  public markEndpointUnhealthy(serviceName: string, endpointUrl: string): void {
    const endpoints = this.serviceEndpoints.get(serviceName);
    if (endpoints) {
      const endpoint = endpoints.find(e => `${e.url}:${e.port}` === endpointUrl);
      if (endpoint) {
        endpoint.healthy = false;
        endpoint.lastCheck = new Date();
        
        logger.warn('Endpoint manually marked unhealthy', {
          service: serviceName,
          endpoint: endpointUrl
        });
      }
    }
  }

  /**
   * Stop health checks
   */
  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
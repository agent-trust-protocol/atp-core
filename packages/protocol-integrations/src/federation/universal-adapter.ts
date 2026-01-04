/**
 * Universal Adapter - Generic protocol adapter interface
 * Provides standardized interface for all protocol adapters
 */

import { EventEmitter } from 'events';
import { SupportedProtocol, UniversalMessage, UniversalMessageType } from './federation-engine.js';

export interface AdapterConfig {
  protocol: SupportedProtocol;
  endpoint?: string;
  credentials?: any;
  options?: Record<string, any>;
  enabled: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: number;
  lastError?: string;
  retryCount: number;
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    errorsEncountered: number;
    averageLatency: number;
  };
}

export abstract class UniversalAdapter extends EventEmitter {
  protected config: AdapterConfig;
  protected connectionStatus: ConnectionStatus;
  protected retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AdapterConfig) {
    super();
    this.config = config;
    this.connectionStatus = {
      connected: false,
      retryCount: 0,
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        errorsEncountered: 0,
        averageLatency: 0
      }
    };
  }

  /**
   * Connect to the protocol endpoint
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the protocol endpoint
   */
  abstract disconnect(): Promise<void>;

  /**
   * Send message through the protocol
   */
  abstract sendMessage(message: UniversalMessage): Promise<string>;

  /**
   * Subscribe to incoming messages
   */
  abstract subscribe(messageTypes?: UniversalMessageType[]): Promise<void>;

  /**
   * Unsubscribe from messages
   */
  abstract unsubscribe(): Promise<void>;

  /**
   * Health check for the adapter
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get adapter capabilities
   */
  abstract getCapabilities(): string[];

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get adapter configuration
   */
  getConfig(): AdapterConfig {
    return { ...this.config };
  }

  /**
   * Update adapter configuration
   */
  updateConfig(newConfig: Partial<AdapterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Start automatic reconnection
   */
  protected startReconnection(delay: number = 5000): void {
    if (this.retryTimeouts.has('reconnect')) {
      return; // Already reconnecting
    }

    const timeout = setTimeout(async () => {
      try {
        await this.connect();
        this.connectionStatus.retryCount = 0;
        this.retryTimeouts.delete('reconnect');
      } catch (error) {
        this.connectionStatus.retryCount++;
        this.connectionStatus.lastError = error instanceof Error ? error.message : String(error);
        
        // Exponential backoff
        const nextDelay = Math.min(delay * Math.pow(2, this.connectionStatus.retryCount), 60000);
        this.startReconnection(nextDelay);
      }
    }, delay);

    this.retryTimeouts.set('reconnect', timeout);
  }

  /**
   * Stop reconnection attempts
   */
  protected stopReconnection(): void {
    const timeout = this.retryTimeouts.get('reconnect');
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete('reconnect');
    }
  }

  /**
   * Update connection metrics
   */
  protected updateMetrics(type: 'sent' | 'received' | 'error', latency?: number): void {
    switch (type) {
      case 'sent':
        this.connectionStatus.metrics.messagesSent++;
        break;
      case 'received':
        this.connectionStatus.metrics.messagesReceived++;
        break;
      case 'error':
        this.connectionStatus.metrics.errorsEncountered++;
        break;
    }

    if (latency !== undefined) {
      const currentAvg = this.connectionStatus.metrics.averageLatency;
      const totalMessages = this.connectionStatus.metrics.messagesSent + this.connectionStatus.metrics.messagesReceived;
      this.connectionStatus.metrics.averageLatency = 
        (currentAvg * (totalMessages - 1) + latency) / totalMessages;
    }
  }

  /**
   * Validate message format
   */
  protected validateMessage(message: UniversalMessage): boolean {
    return !!(
      message.messageId &&
      message.messageType &&
      message.sourceProtocol &&
      message.targetProtocol &&
      message.sourceAgent &&
      message.targetAgent
    );
  }

  /**
   * Handle connection established
   */
  protected onConnected(): void {
    this.connectionStatus.connected = true;
    this.connectionStatus.lastConnected = Date.now();
    this.connectionStatus.lastError = undefined;
    this.stopReconnection();
    
    this.emit('connected', {
      protocol: this.config.protocol,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection lost
   */
  protected onDisconnected(error?: Error): void {
    this.connectionStatus.connected = false;
    
    if (error) {
      this.connectionStatus.lastError = error.message;
      this.updateMetrics('error');
      
      this.emit('error', {
        protocol: this.config.protocol,
        error: error.message,
        timestamp: Date.now()
      });

      // Start reconnection if adapter is enabled
      if (this.config.enabled) {
        this.startReconnection();
      }
    }

    this.emit('disconnected', {
      protocol: this.config.protocol,
      error: error?.message,
      timestamp: Date.now()
    });
  }

  /**
   * Handle incoming message
   */
  protected onMessageReceived(message: UniversalMessage): void {
    this.updateMetrics('received');
    
    this.emit('messageReceived', {
      protocol: this.config.protocol,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Handle message sent
   */
  protected onMessageSent(messageId: string, latency?: number): void {
    this.updateMetrics('sent', latency);
    
    this.emit('messageSent', {
      protocol: this.config.protocol,
      messageId,
      latency,
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopReconnection();
    
    // Clear all timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    // Disconnect if connected
    if (this.connectionStatus.connected) {
      await this.disconnect();
    }

    this.removeAllListeners();
  }
}

/**
 * Mock adapter for testing purposes
 */
export class MockAdapter extends UniversalAdapter {
  private mockConnected: boolean = false;

  async connect(): Promise<void> {
    this.mockConnected = true;
    this.onConnected();
  }

  async disconnect(): Promise<void> {
    this.mockConnected = false;
    this.onDisconnected();
  }

  async sendMessage(message: UniversalMessage): Promise<string> {
    if (!this.mockConnected) {
      throw new Error('Adapter not connected');
    }

    if (!this.validateMessage(message)) {
      throw new Error('Invalid message format');
    }

    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // Simulate async sending
    setTimeout(() => {
      this.onMessageSent(messageId, Math.random() * 100);
    }, 10);

    return messageId;
  }

  async subscribe(messageTypes?: UniversalMessageType[]): Promise<void> {
    // Mock subscription
  }

  async unsubscribe(): Promise<void> {
    // Mock unsubscription
  }

  async healthCheck(): Promise<boolean> {
    return this.mockConnected;
  }

  getCapabilities(): string[] {
    return ['send', 'receive', 'subscribe', 'mock'];
  }

  /**
   * Simulate receiving a message (for testing)
   */
  simulateMessageReceived(message: UniversalMessage): void {
    this.onMessageReceived(message);
  }
}
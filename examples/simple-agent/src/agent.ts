import WebSocket from 'ws';
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { webcrypto } from 'crypto';

// Initialize crypto polyfills for this local instance
function initializeAgentCrypto() {
  if (!(globalThis as any).crypto) {
    (globalThis as any).crypto = webcrypto;
  }

  // Set up SHA-512 sync function for this local @noble/ed25519 instance
  if (!ed25519.etc.sha512Sync) {
    ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));
  }
}

// Initialize immediately
initializeAgentCrypto();

export interface AgentConfig {
  name: string;
  atpGateway: string;
  did?: string;
  privateKey?: string;
}

export class SimpleAgent {
  private ws: WebSocket | null = null;
  private did: string | null = null;
  protected privateKey: string | null = null;
  private authenticated = false;
  private subscriptions = new Map<string, Function>();

  constructor(private config: AgentConfig) {
    this.did = config.did || null;
    this.privateKey = config.privateKey || null;
  }

  async initialize(): Promise<void> {
    if (!this.did || !this.privateKey) {
      console.log('No DID provided, registering new identity...');
      await this.registerIdentity();
    }
    
    await this.connect();
    await this.authenticate();
  }

  private async registerIdentity(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/identity/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json() as any;
      if (result.success) {
        this.did = result.data.did;
        this.privateKey = result.data.privateKey;
        console.log(`Registered new DID: ${this.did}`);
      } else {
        throw new Error('Failed to register identity');
      }
    } catch (error) {
      console.error('Identity registration failed:', error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.atpGateway);
      
      this.ws.on('open', () => {
        console.log('Connected to ATP Gateway');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from ATP Gateway');
        this.authenticated = false;
      });
    });
  }

  private async authenticate(): Promise<void> {
    if (!this.did || !this.privateKey || !this.ws) {
      throw new Error('Cannot authenticate without DID, private key, and connection');
    }

    const timestamp = Date.now();
    const challenge = `${this.did}:${timestamp}`;
    const messageBytes = Buffer.from(challenge, 'utf8');
    const privateKeyBytes = Buffer.from(this.privateKey, 'hex');
    const signature = await ed25519.sign(messageBytes, privateKeyBytes);
    const proof = Buffer.from(signature).toString('hex');

    const authMessage = {
      type: 'auth',
      payload: {
        did: this.did,
        proof,
        timestamp,
      },
    };

    this.ws.send(JSON.stringify(authMessage));
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'notification':
        this.handleNotification(message.payload);
        break;
      case 'rpc':
        this.handleRPCResponse(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleNotification(payload: any): void {
    switch (payload.event) {
      case 'connected':
        console.log(`Connected with client ID: ${payload.clientId}`);
        break;
      case 'authenticated':
        if (payload.success) {
          this.authenticated = true;
          console.log('Authentication successful');
          this.onReady();
        } else {
          console.error('Authentication failed:', payload.error);
        }
        break;
      default:
        // Check subscriptions
        for (const [event, callback] of this.subscriptions.entries()) {
          if (payload.event === event) {
            callback(payload.data);
          }
        }
    }
  }

  private handleRPCResponse(payload: any): void {
    console.log('RPC Response:', payload);
  }

  protected onReady(): void {
    console.log(`Agent ${this.config.name} is ready!`);
  }

  async invoke(method: string, params?: any): Promise<any> {
    if (!this.authenticated || !this.ws) {
      throw new Error('Not authenticated or not connected');
    }

    const request = {
      type: 'rpc',
      payload: {
        jsonrpc: '2.0',
        method,
        params,
        id: Math.random().toString(36).substring(7),
      },
    };

    this.ws.send(JSON.stringify(request));
  }

  subscribe(event: string, callback: Function): void {
    this.subscriptions.set(event, callback);
    
    if (this.authenticated && this.ws) {
      const subscription = {
        type: 'subscribe',
        payload: {
          id: Math.random().toString(36).substring(7),
          event,
        },
      };
      
      this.ws.send(JSON.stringify(subscription));
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.authenticated = false;
  }

  getDID(): string | null {
    return this.did;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }
}
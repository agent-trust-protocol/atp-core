import { AuditEvent } from '../models/audit.js';

export class IPFSService {
  private helia: any;
  private json: any;
  private strings: any;
  private initialized: boolean = false;

  constructor(private url: string = 'http://127.0.0.1:5001') {
    // Initialize lazily to avoid blocking startup
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic imports for ES modules
      const { createHeliaHTTP } = await import('@helia/http');
      const { json } = await import('@helia/json');
      const { strings } = await import('@helia/strings');

      this.helia = await createHeliaHTTP({
        // Use default configuration for now
      });
      this.json = json(this.helia);
      this.strings = strings(this.helia);
      this.initialized = true;
      
      console.log('IPFS service initialized with Helia HTTP');
    } catch (error) {
      console.warn('Failed to initialize IPFS service:', error);
      this.initialized = false;
    }
  }

  async storeEvent(event: AuditEvent): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.initialized) {
        console.log('IPFS storage skipped (not available)');
        return '';
      }

      // Store the audit event as JSON
      const cid = await this.json.add(event);
      console.log('Audit event stored to IPFS:', cid.toString());
      
      return cid.toString();
    } catch (error) {
      console.warn('IPFS storage failed, continuing without IPFS:', error);
      return '';
    }
  }

  async retrieveEvent(hash: string): Promise<AuditEvent | null> {
    try {
      await this.initialize();
      
      if (!this.initialized || !hash) {
        console.log('IPFS retrieval skipped (not available or no hash)');
        return null;
      }

      // Retrieve the audit event from IPFS
      const event = await this.json.get(hash);
      console.log('Audit event retrieved from IPFS:', hash);
      
      return event as AuditEvent;
    } catch (error) {
      console.warn('IPFS retrieval failed:', error);
      return null;
    }
  }

  async pin(hash: string): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.initialized || !hash) {
        console.log('IPFS pinning skipped (not available or no hash)');
        return;
      }

      // Note: Helia HTTP doesn't support pinning directly
      // This would require a full IPFS node or pinning service
      console.log('IPFS pinning not supported with HTTP gateway');
    } catch (error) {
      console.warn('IPFS pinning failed:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return this.initialized;
    } catch (error) {
      return false;
    }
  }

  async storeString(data: string): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.initialized) {
        console.log('IPFS string storage skipped (not available)');
        return '';
      }

      const cid = await this.strings.add(data);
      console.log('String stored to IPFS:', cid.toString());
      
      return cid.toString();
    } catch (error) {
      console.warn('IPFS string storage failed:', error);
      return '';
    }
  }

  async retrieveString(hash: string): Promise<string | null> {
    try {
      await this.initialize();
      
      if (!this.initialized || !hash) {
        console.log('IPFS string retrieval skipped (not available or no hash)');
        return null;
      }

      const data = await this.strings.get(hash);
      console.log('String retrieved from IPFS:', hash);
      
      return data;
    } catch (error) {
      console.warn('IPFS string retrieval failed:', error);
      return null;
    }
  }
}
import { create } from 'ipfs-http-client';
import { AuditEvent } from '../models/audit.js';

export class IPFSService {
  private client: any;

  constructor(url: string = 'http://127.0.0.1:5001') {
    this.client = create({ url });
  }

  async storeEvent(event: AuditEvent): Promise<string> {
    try {
      const eventData = JSON.stringify(event);
      const result = await this.client.add(eventData);
      return result.cid.toString();
    } catch (error) {
      console.warn('IPFS storage failed, continuing without IPFS:', error);
      return '';
    }
  }

  async retrieveEvent(hash: string): Promise<AuditEvent | null> {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks).toString();
      return JSON.parse(data);
    } catch (error) {
      console.warn('IPFS retrieval failed:', error);
      return null;
    }
  }

  async pin(hash: string): Promise<void> {
    try {
      await this.client.pin.add(hash);
    } catch (error) {
      console.warn('IPFS pinning failed:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.id();
      return true;
    } catch {
      return false;
    }
  }
}
import { AuditEvent, AuditQuery } from '../models/audit.js';

export interface IAuditStorageService {
  storeEvent(event: AuditEvent): Promise<void>;
  getEvent(id: string): Promise<AuditEvent | null>;
  queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }>;
  getLastEvent(): Promise<AuditEvent | null>;
  verifyChain(): Promise<{ valid: boolean; brokenAt?: string }>;
  close(): Promise<void> | void;
}
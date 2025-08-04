/**
 * Logger utility for ATP components
 */

export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  info(message: string, meta?: any): void {
    console.log(`[${this.context}] INFO: ${message}`, meta || '');
  }
  
  error(message: string, meta?: any): void {
    console.error(`[${this.context}] ERROR: ${message}`, meta || '');
  }
  
  warn(message: string, meta?: any): void {
    console.warn(`[${this.context}] WARN: ${message}`, meta || '');
  }
  
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${message}`, meta || '');
    }
  }
}
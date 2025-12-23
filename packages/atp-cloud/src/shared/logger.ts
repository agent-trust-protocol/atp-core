/**
 * ATP Cloud Logger
 * Centralized logging for all cloud services
 */

import winston from 'winston';
import { config } from './config.js';

// Create logger instance
const logger = winston.createLogger({
  level: config.isDevelopment() ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info: any) => {
      const { timestamp, level, message, service, tenantId, ...meta } = info;
      const logEntry = {
        timestamp,
        level,
        message,
        service: service || 'atp-cloud',
        ...(tenantId && { tenantId }),
        ...(typeof meta === 'object' && meta !== null ? meta : {})
      };
      return JSON.stringify(logEntry);
    })
  ),
  defaultMeta: {
    service: 'atp-cloud',
    version: '0.1.0-alpha',
    environment: config.getConfig().environment
  },
  transports: [
    new winston.transports.Console({
      format: config.isDevelopment()
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json()
    })
  ]
});

// Add file transport for production
if (config.isProduction()) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

// Create service-specific loggers
export const createServiceLogger = (serviceName: string) => {
  return logger.child({ service: serviceName });
};

// Create tenant-specific logger
export const createTenantLogger = (serviceName: string, tenantId: string) => {
  return logger.child({ service: serviceName, tenantId });
};

// Export default logger
export { logger };
export default logger;
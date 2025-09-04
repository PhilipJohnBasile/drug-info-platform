import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  success?: boolean;
  error?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf((info) => {
          const { timestamp, level, message, context, requestId, userId, ...meta } = info;
          
          return JSON.stringify({
            timestamp,
            level,
            message,
            context: context || this.context,
            requestId,
            userId,
            ...meta,
            environment: this.configService.get('NODE_ENV', 'development'),
            service: 'drug-info-backend',
            version: this.configService.get('APP_VERSION', '1.0.0'),
          });
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info) => {
              const { timestamp, level, message, context, requestId } = info;
              const ctx = context || this.context;
              const reqId = requestId ? `[${requestId}]` : '';
              return `${timestamp} [${level}] ${ctx ? `[${ctx}]` : ''} ${reqId} ${message}`;
            })
          ),
        }),
      ],
    });

    // Add file transport for production
    if (this.configService.get('NODE_ENV') === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
      
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    // Add external logging service in production
    if (this.configService.get('EXTERNAL_LOGGING_ENABLED') === 'true') {
      // Could add Datadog, New Relic, etc.
      this.addExternalTransports();
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string, logContext?: LogContext) {
    this.logger.info(message, { context, ...logContext });
  }

  error(message: any, stack?: string, context?: string, logContext?: LogContext) {
    this.logger.error(message, { stack, context, ...logContext });
  }

  warn(message: any, context?: string, logContext?: LogContext) {
    this.logger.warn(message, { context, ...logContext });
  }

  debug(message: any, context?: string, logContext?: LogContext) {
    this.logger.debug(message, { context, ...logContext });
  }

  verbose(message: any, context?: string, logContext?: LogContext) {
    this.logger.verbose(message, { context, ...logContext });
  }

  // Structured logging methods
  logApiCall(endpoint: string, method: string, duration: number, statusCode: number, logContext?: LogContext) {
    this.logger.info('API Call', {
      endpoint,
      method,
      duration,
      statusCode,
      type: 'api_call',
      ...logContext,
    });
  }

  logDatabaseQuery(query: string, duration: number, logContext?: LogContext) {
    this.logger.info('Database Query', {
      query: this.sanitizeQuery(query),
      duration,
      type: 'database_query',
      ...logContext,
    });
  }

  logAIRequest(provider: string, model: string, duration: number, tokensUsed?: number, logContext?: LogContext) {
    this.logger.info('AI Request', {
      provider,
      model,
      duration,
      tokensUsed,
      type: 'ai_request',
      ...logContext,
    });
  }

  logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, logContext?: LogContext) {
    this.logger.info('Cache Operation', {
      operation,
      key: this.sanitizeKey(key),
      type: 'cache_operation',
      ...logContext,
    });
  }

  logBusinessEvent(eventName: string, data: Record<string, any>, logContext?: LogContext) {
    this.logger.info('Business Event', {
      eventName,
      data,
      type: 'business_event',
      ...logContext,
    });
  }

  logSecurityEvent(eventType: 'rate_limit' | 'auth_failure' | 'suspicious_activity', details: Record<string, any>, logContext?: LogContext) {
    this.logger.warn('Security Event', {
      eventType,
      details,
      type: 'security_event',
      ...logContext,
    });
  }

  logPerformanceMetric(metricName: string, value: number, unit: string, logContext?: LogContext) {
    this.logger.info('Performance Metric', {
      metricName,
      value,
      unit,
      type: 'performance_metric',
      ...logContext,
    });
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from SQL queries
    return query.replace(/('.*?'|".*?")/g, "'***'").substring(0, 200);
  }

  private sanitizeKey(key: string): string {
    // Remove sensitive data from cache keys
    return key.replace(/user:\d+|api_key:\w+/g, '***');
  }

  private addExternalTransports() {
    // Add external logging transports based on configuration
    const externalService = this.configService.get('EXTERNAL_LOGGING_SERVICE');
    
    switch (externalService) {
      case 'datadog':
        // Add Datadog transport
        break;
      case 'newrelic':
        // Add New Relic transport
        break;
      case 'elasticsearch':
        // Add Elasticsearch transport
        break;
      default:
        this.logger.info('No external logging service configured');
    }
  }
}

// Performance monitoring decorator
export function LogPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const logger = new AppLoggerService(new ConfigService());
      logger.setContext(target.constructor.name);
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        logger.logPerformanceMetric(
          `${operation}_duration`,
          duration,
          'ms',
          { operation, success: true }
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        logger.logPerformanceMetric(
          `${operation}_duration`,
          duration,
          'ms',
          { operation, success: false, error: error.message }
        );
        
        throw error;
      }
    };
  };
}
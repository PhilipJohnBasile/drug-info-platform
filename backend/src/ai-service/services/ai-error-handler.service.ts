import { Injectable, Logger } from '@nestjs/common';

export interface AIError {
  provider: string;
  endpoint: string;
  errorType: 'RATE_LIMIT' | 'API_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  statusCode?: number;
  timestamp: Date;
  context?: Record<string, any>;
  retryCount?: number;
}

export interface AIMetrics {
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  providerHealth: Record<string, boolean>;
  lastUpdate: Date;
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  retryDelay: number;
  fallbackAction: 'USE_CACHE' | 'USE_FALLBACK' | 'FAIL_GRACEFULLY' | 'RETRY_WITH_DIFFERENT_PROVIDER';
  maxRetries: number;
}

@Injectable()
export class AIErrorHandlerService {
  private readonly logger = new Logger(AIErrorHandlerService.name);
  private errorHistory: AIError[] = [];
  private metrics: AIMetrics = {
    successRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    providerHealth: {},
    lastUpdate: new Date()
  };
  
  private readonly MAX_ERROR_HISTORY = 1000;
  private requestCount = 0;
  private successCount = 0;
  private totalResponseTime = 0;
  private cacheHits = 0;
  private cacheRequests = 0;

  async handleAIError(error: any, context: {
    provider: string;
    endpoint: string;
    attempt?: number;
    maxAttempts?: number;
    requestId?: string;
  }): Promise<ErrorRecoveryStrategy> {
    const aiError = this.categorizeError(error, context);
    this.recordError(aiError);
    
    const strategy = this.determineRecoveryStrategy(aiError, context);
    
    this.logger.error(`AI Error in ${context.provider}:${context.endpoint}`, {
      error: aiError,
      strategy,
      context
    });

    // Update provider health status
    this.updateProviderHealth(context.provider, false);
    
    return strategy;
  }

  recordSuccess(context: {
    provider: string;
    endpoint: string;
    responseTime: number;
    fromCache?: boolean;
    requestId?: string;
  }): void {
    this.requestCount++;
    this.successCount++;
    this.totalResponseTime += context.responseTime;
    
    if (context.fromCache) {
      this.cacheHits++;
    }
    this.cacheRequests++;
    
    // Update provider health status
    this.updateProviderHealth(context.provider, true);
    
    this.updateMetrics();
    
    this.logger.debug(`AI Success in ${context.provider}:${context.endpoint}`, {
      responseTime: context.responseTime,
      fromCache: context.fromCache,
      requestId: context.requestId
    });
  }

  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  getRecentErrors(limit: number = 50): AIError[] {
    return this.errorHistory.slice(-limit);
  }

  getProviderHealth(provider: string): boolean {
    return this.metrics.providerHealth[provider] ?? false;
  }

  async isSystemHealthy(): Promise<boolean> {
    const recentErrors = this.getRecentErrors(10);
    const recentTime = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
    
    const recentErrorCount = recentErrors.filter(error => error.timestamp > recentTime).length;
    const hasHealthyProvider = Object.values(this.metrics.providerHealth).some(healthy => healthy);
    
    return recentErrorCount < 5 && hasHealthyProvider && this.metrics.successRate > 0.7;
  }

  generateHealthReport(): Record<string, any> {
    const recentErrors = this.getRecentErrors(100);
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByProvider = recentErrors.reduce((acc, error) => {
      acc[error.provider] = (acc[error.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      metrics: this.metrics,
      errorsByType,
      errorsByProvider,
      systemHealth: {
        isHealthy: this.isSystemHealthy(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      recommendations: this.generateRecommendations()
    };
  }

  private categorizeError(error: any, context: any): AIError {
    let errorType: AIError['errorType'] = 'UNKNOWN';
    let statusCode: number | undefined;

    if (error.response?.status) {
      statusCode = error.response.status;
      
      if (statusCode === 429) {
        errorType = 'RATE_LIMIT';
      } else if (statusCode >= 400 && statusCode < 500) {
        errorType = 'API_ERROR';
      } else if (statusCode >= 500) {
        errorType = 'API_ERROR';
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorType = 'TIMEOUT';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorType = 'NETWORK_ERROR';
    } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      errorType = 'VALIDATION_ERROR';
    }

    return {
      provider: context.provider,
      endpoint: context.endpoint,
      errorType,
      message: error.message || 'Unknown error',
      statusCode,
      timestamp: new Date(),
      context: {
        requestId: context.requestId,
        attempt: context.attempt,
        maxAttempts: context.maxAttempts
      },
      retryCount: context.attempt || 0
    };
  }

  private determineRecoveryStrategy(error: AIError, context: any): ErrorRecoveryStrategy {
    const attempt = context.attempt || 0;
    const maxAttempts = context.maxAttempts || 3;

    switch (error.errorType) {
      case 'RATE_LIMIT':
        return {
          shouldRetry: attempt < maxAttempts,
          retryDelay: Math.min(1000 * Math.pow(2, attempt), 30000), // Exponential backoff up to 30s
          fallbackAction: attempt >= maxAttempts ? 'USE_CACHE' : 'RETRY_WITH_DIFFERENT_PROVIDER',
          maxRetries: maxAttempts
        };

      case 'TIMEOUT':
        return {
          shouldRetry: attempt < maxAttempts,
          retryDelay: 1000 + (attempt * 500),
          fallbackAction: 'RETRY_WITH_DIFFERENT_PROVIDER',
          maxRetries: maxAttempts
        };

      case 'NETWORK_ERROR':
        return {
          shouldRetry: attempt < 2, // Fewer retries for network issues
          retryDelay: 2000 + (attempt * 1000),
          fallbackAction: 'USE_CACHE',
          maxRetries: 2
        };

      case 'API_ERROR':
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          // Client errors - don't retry
          return {
            shouldRetry: false,
            retryDelay: 0,
            fallbackAction: 'USE_FALLBACK',
            maxRetries: 0
          };
        } else {
          // Server errors - retry with backoff
          return {
            shouldRetry: attempt < maxAttempts,
            retryDelay: 1000 * Math.pow(2, attempt),
            fallbackAction: 'USE_CACHE',
            maxRetries: maxAttempts
          };
        }

      case 'VALIDATION_ERROR':
        return {
          shouldRetry: false,
          retryDelay: 0,
          fallbackAction: 'USE_FALLBACK',
          maxRetries: 0
        };

      default:
        return {
          shouldRetry: attempt < maxAttempts,
          retryDelay: 1000,
          fallbackAction: 'USE_CACHE',
          maxRetries: maxAttempts
        };
    }
  }

  private recordError(error: AIError): void {
    this.errorHistory.push(error);
    
    // Keep only recent errors to prevent memory leaks
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory = this.errorHistory.slice(-this.MAX_ERROR_HISTORY);
    }
    
    this.requestCount++;
    this.updateMetrics();
  }

  private updateProviderHealth(provider: string, isHealthy: boolean): void {
    this.metrics.providerHealth[provider] = isHealthy;
  }

  private updateMetrics(): void {
    this.metrics.successRate = this.requestCount > 0 ? this.successCount / this.requestCount : 0;
    this.metrics.errorRate = this.requestCount > 0 ? (this.requestCount - this.successCount) / this.requestCount : 0;
    this.metrics.averageResponseTime = this.successCount > 0 ? this.totalResponseTime / this.successCount : 0;
    this.metrics.cacheHitRate = this.cacheRequests > 0 ? this.cacheHits / this.cacheRequests : 0;
    this.metrics.lastUpdate = new Date();
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.successRate < 0.8) {
      recommendations.push('System success rate is low. Consider implementing additional fallback mechanisms.');
    }
    
    if (this.metrics.averageResponseTime > 5000) {
      recommendations.push('Average response time is high. Consider implementing request timeouts or caching strategies.');
    }
    
    if (this.metrics.cacheHitRate < 0.3) {
      recommendations.push('Cache hit rate is low. Review caching strategy and cache duration settings.');
    }
    
    const unhealthyProviders = Object.entries(this.metrics.providerHealth)
      .filter(([_, healthy]) => !healthy)
      .map(([provider, _]) => provider);
      
    if (unhealthyProviders.length > 0) {
      recommendations.push(`The following providers are unhealthy: ${unhealthyProviders.join(', ')}. Check their status and configuration.`);
    }
    
    const recentErrors = this.getRecentErrors(20);
    const rateLimitErrors = recentErrors.filter(e => e.errorType === 'RATE_LIMIT').length;
    
    if (rateLimitErrors > 5) {
      recommendations.push('High number of rate limit errors detected. Consider implementing better rate limiting or upgrading API plans.');
    }
    
    return recommendations;
  }

  // Method to reset metrics for testing or maintenance
  resetMetrics(): void {
    this.errorHistory = [];
    this.requestCount = 0;
    this.successCount = 0;
    this.totalResponseTime = 0;
    this.cacheHits = 0;
    this.cacheRequests = 0;
    this.metrics = {
      successRate: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      providerHealth: {},
      lastUpdate: new Date()
    };
  }
}
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { AppLoggerService } from './logger.service';

export interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface HealthMetrics {
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    percentage: number;
    loadAverage: number[];
  };
  database: {
    connected: boolean;
    responseTime?: number;
  };
  redis: {
    connected: boolean;
    responseTime?: number;
  };
  ai: {
    huggingface: { available: boolean; responseTime?: number };
  };
  requests: {
    total: number;
    lastMinute: number;
    errorRate: number;
  };
}

@Injectable()
export class MetricsService {
  private startTime: number;
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private responseTimeCount = 0;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private logger: AppLoggerService,
  ) {
    this.startTime = Date.now();
    this.logger.setContext('MetricsService');
  }

  // Counter metrics
  incrementCounter(name: string, value = 1, tags?: Record<string, string>) {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.logger.logPerformanceMetric(name, value, 'count', { tags: tags ? Object.keys(tags).map(k => `${k}:${tags[k]}`) : [] });
    this.storeMetric(metric);
  }

  // Gauge metrics
  recordGauge(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.logger.logPerformanceMetric(name, value, 'gauge', { tags: tags ? Object.keys(tags).map(k => `${k}:${tags[k]}`) : [] });
    this.storeMetric(metric);
  }

  // Histogram metrics
  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.logger.logPerformanceMetric(name, value, 'histogram', { tags: tags ? Object.keys(tags).map(k => `${k}:${tags[k]}`) : [] });
    this.storeMetric(metric);
  }

  // Specific business metrics
  recordApiRequest(endpoint: string, method: string, statusCode: number, responseTime: number) {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;

    if (statusCode >= 400) {
      this.errorCount++;
    }

    this.incrementCounter('api.requests.total', 1, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });

    this.recordHistogram('api.response_time', responseTime, {
      endpoint,
      method,
    });

    // Store in Redis for real-time metrics
    this.storeRequestMetric(endpoint, method, statusCode, responseTime);
  }

  recordDatabaseQuery(queryType: string, duration: number, success: boolean) {
    this.recordHistogram('database.query_duration', duration, {
      query_type: queryType,
      success: success.toString(),
    });

    this.incrementCounter('database.queries.total', 1, {
      query_type: queryType,
      success: success.toString(),
    });
  }

  recordAIRequest(provider: string, model: string, duration: number, success: boolean, tokens?: number) {
    this.recordHistogram('ai.request_duration', duration, {
      provider,
      model,
      success: success.toString(),
    });

    this.incrementCounter('ai.requests.total', 1, {
      provider,
      model,
      success: success.toString(),
    });

    if (tokens) {
      this.recordGauge('ai.tokens_used', tokens, { provider, model });
    }
  }

  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', duration?: number) {
    this.incrementCounter('cache.operations.total', 1, { operation });

    if (duration) {
      this.recordHistogram('cache.operation_duration', duration, { operation });
    }
  }

  recordRateLimitHit(endpoint: string, ip: string) {
    this.incrementCounter('rate_limit.hits.total', 1, { endpoint });
    
    this.logger.logSecurityEvent('rate_limit', {
      endpoint,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Health check metrics
  async getHealthMetrics(): Promise<HealthMetrics> {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    // Test database connection
    const dbHealth = await this.testDatabaseConnection();
    const redisHealth = await this.testRedisConnection();
    const aiHealth = await this.testAIConnections();

    // Get request metrics from last minute
    const requestMetrics = await this.getRequestMetrics();

    return {
      uptime,
      memory: {
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        percentage: process.cpuUsage().user / 1000000, // Convert to percentage
        loadAverage: process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg(),
      },
      database: dbHealth,
      redis: redisHealth,
      ai: aiHealth,
      requests: requestMetrics,
    };
  }

  private async storeMetric(metric: MetricPoint) {
    try {
      // Store metric in Redis with TTL for time-series data
      const key = `metrics:${metric.name}:${Math.floor(metric.timestamp / 60000)}`; // Per minute
      await this.redisService.getClient().zadd(key, metric.timestamp, JSON.stringify(metric));
      await this.redisService.getClient().expire(key, 3600); // 1 hour TTL
    } catch (error) {
      this.logger.error('Failed to store metric', error.stack, 'MetricsService');
    }
  }

  private async storeRequestMetric(endpoint: string, method: string, statusCode: number, responseTime: number) {
    try {
      const timestamp = Date.now();
      const minuteKey = Math.floor(timestamp / 60000);
      
      // Store request count per minute
      await this.redisService.getClient().incr(`requests:${minuteKey}`);
      await this.redisService.getClient().expire(`requests:${minuteKey}`, 300); // 5 minutes TTL

      // Store error count if error
      if (statusCode >= 400) {
        await this.redisService.getClient().incr(`errors:${minuteKey}`);
        await this.redisService.getClient().expire(`errors:${minuteKey}`, 300);
      }

      // Store response time
      await this.redisService.getClient().lpush(`response_times:${minuteKey}`, responseTime);
      await this.redisService.getClient().expire(`response_times:${minuteKey}`, 300);
      await this.redisService.getClient().ltrim(`response_times:${minuteKey}`, 0, 999); // Keep last 1000
    } catch (error) {
      this.logger.error('Failed to store request metric', error.stack, 'MetricsService');
    }
  }

  private async testDatabaseConnection(): Promise<{ connected: boolean; responseTime?: number }> {
    try {
      const start = Date.now();
      // This would use your PrismaService to test connection
      // await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      return { connected: true, responseTime };
    } catch (error) {
      return { connected: false };
    }
  }

  private async testRedisConnection(): Promise<{ connected: boolean; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.redisService.getClient().ping();
      const responseTime = Date.now() - start;
      return { connected: true, responseTime };
    } catch (error) {
      return { connected: false };
    }
  }

  private async testAIConnections(): Promise<{
    huggingface: { available: boolean; responseTime?: number };
  }> {
    // These would be actual health checks to AI services
    // For now, returning mock data
    return {
      huggingface: { available: true, responseTime: 200 },
    };
  }

  private async getRequestMetrics(): Promise<{
    total: number;
    lastMinute: number;
    errorRate: number;
  }> {
    try {
      const currentMinute = Math.floor(Date.now() / 60000);
      const lastMinuteRequests = await this.redisService.getClient().get(`requests:${currentMinute - 1}`);
      const lastMinuteErrors = await this.redisService.getClient().get(`errors:${currentMinute - 1}`);

      const requests = parseInt(lastMinuteRequests || '0', 10);
      const errors = parseInt(lastMinuteErrors || '0', 10);
      const errorRate = requests > 0 ? (errors / requests) * 100 : 0;

      return {
        total: this.requestCount,
        lastMinute: requests,
        errorRate,
      };
    } catch (error) {
      return {
        total: this.requestCount,
        lastMinute: 0,
        errorRate: 0,
      };
    }
  }

  // Export metrics for Prometheus or other monitoring systems
  async exportPrometheusMetrics(): Promise<string> {
    const healthMetrics = await this.getHealthMetrics();
    
    let metrics = '';
    
    // Format metrics in Prometheus format
    metrics += `# HELP app_uptime_seconds Application uptime in seconds\n`;
    metrics += `# TYPE app_uptime_seconds gauge\n`;
    metrics += `app_uptime_seconds ${healthMetrics.uptime / 1000}\n\n`;
    
    metrics += `# HELP app_memory_used_bytes Memory used in bytes\n`;
    metrics += `# TYPE app_memory_used_bytes gauge\n`;
    metrics += `app_memory_used_bytes ${healthMetrics.memory.used}\n\n`;
    
    metrics += `# HELP app_requests_total Total number of requests\n`;
    metrics += `# TYPE app_requests_total counter\n`;
    metrics += `app_requests_total ${healthMetrics.requests.total}\n\n`;
    
    metrics += `# HELP app_error_rate Error rate percentage\n`;
    metrics += `# TYPE app_error_rate gauge\n`;
    metrics += `app_error_rate ${healthMetrics.requests.errorRate}\n\n`;

    return metrics;
  }
}
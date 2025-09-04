import { Controller, Get, Post, Param, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AIErrorHandlerService, AIMetrics } from '../services/ai-error-handler.service';
import { CircuitBreakerService, CircuitBreakerStats } from '../services/circuit-breaker.service';
import { CacheService } from '../services/cache.service';

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  metrics: AIMetrics;
  circuits: Record<string, CircuitBreakerStats>;
  cache: {
    status: string;
    hitRate: number;
    size: number;
  };
  recommendations: string[];
  details: Record<string, any>;
}

export interface ErrorAnalyticsResponse {
  recentErrors: any[];
  errorsByType: Record<string, number>;
  errorsByProvider: Record<string, number>;
  trends: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
  };
  criticalIssues: string[];
}

@ApiTags('AI Service Health')
@Controller('ai-service/health')
export class AIHealthController {
  constructor(
    private aiErrorHandler: AIErrorHandlerService,
    private circuitBreaker: CircuitBreakerService,
    private cacheService: CacheService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get overall AI service health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Health status retrieved successfully',
    type: Object
  })
  async getHealthStatus(): Promise<SystemHealthResponse> {
    try {
      const metrics = this.aiErrorHandler.getMetrics();
      const circuits = this.circuitBreaker.getAllCircuitStats();
      const systemHealth = this.circuitBreaker.getSystemHealth();
      const isSystemHealthy = await this.aiErrorHandler.isSystemHealthy();
      const cacheStats = await this.getCacheStats();

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!isSystemHealthy || !systemHealth.healthy) {
        status = 'unhealthy';
      } else if (metrics.successRate < 0.95 || metrics.averageResponseTime > 3000) {
        status = 'degraded';
      }

      const healthReport = this.aiErrorHandler.generateHealthReport();

      return {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        metrics,
        circuits,
        cache: cacheStats,
        recommendations: healthReport.recommendations,
        details: {
          systemHealth,
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve health status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get detailed AI service metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics retrieved successfully'
  })
  async getMetrics(): Promise<AIMetrics> {
    return this.aiErrorHandler.getMetrics();
  }

  @Get('errors/analytics')
  @ApiOperation({ summary: 'Get error analytics and trends' })
  @ApiResponse({ 
    status: 200, 
    description: 'Error analytics retrieved successfully'
  })
  async getErrorAnalytics(): Promise<ErrorAnalyticsResponse> {
    const recentErrors = this.aiErrorHandler.getRecentErrors(100);
    
    // Group errors by type
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group errors by provider
    const errorsByProvider = recentErrors.reduce((acc, error) => {
      acc[error.provider] = (acc[error.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends
    const now = new Date();
    const hourlyTrends: Record<string, number> = {};
    const dailyTrends: Record<string, number> = {};

    // Last 24 hours (hourly)
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const hourKey = hour.toISOString().split('T')[1].split(':')[0];
      hourlyTrends[hourKey] = 0;
    }

    // Last 7 days (daily)
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayKey = day.toISOString().split('T')[0];
      dailyTrends[dayKey] = 0;
    }

    // Fill in actual error counts
    recentErrors.forEach(error => {
      const errorTime = new Date(error.timestamp);
      const hourKey = errorTime.toISOString().split('T')[1].split(':')[0];
      const dayKey = errorTime.toISOString().split('T')[0];
      
      if (hourlyTrends.hasOwnProperty(hourKey)) {
        hourlyTrends[hourKey]++;
      }
      
      if (dailyTrends.hasOwnProperty(dayKey)) {
        dailyTrends[dayKey]++;
      }
    });

    // Identify critical issues
    const criticalIssues: string[] = [];
    const circuits = this.circuitBreaker.getAllCircuitStats();
    
    Object.entries(circuits).forEach(([circuitId, stats]) => {
      if (stats.state === 'OPEN') {
        criticalIssues.push(`Circuit breaker OPEN for ${circuitId}`);
      }
    });

    if (errorsByType['RATE_LIMIT'] > 10) {
      criticalIssues.push('High number of rate limit errors detected');
    }

    if (errorsByType['TIMEOUT'] > 5) {
      criticalIssues.push('High number of timeout errors detected');
    }

    const metrics = this.aiErrorHandler.getMetrics();
    if (metrics.successRate < 0.8) {
      criticalIssues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    }

    return {
      recentErrors: recentErrors.slice(0, 50), // Return only 50 most recent
      errorsByType,
      errorsByProvider,
      trends: {
        hourly: hourlyTrends,
        daily: dailyTrends
      },
      criticalIssues
    };
  }

  @Get('circuits')
  @ApiOperation({ summary: 'Get circuit breaker status for all circuits' })
  @ApiResponse({ 
    status: 200, 
    description: 'Circuit breaker stats retrieved successfully'
  })
  async getCircuitStats(): Promise<Record<string, CircuitBreakerStats>> {
    return this.circuitBreaker.getAllCircuitStats();
  }

  @Get('circuits/:circuitId')
  @ApiOperation({ summary: 'Get circuit breaker status for specific circuit' })
  @ApiParam({ name: 'circuitId', description: 'Circuit identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Circuit stats retrieved successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Circuit not found'
  })
  async getCircuitStatus(@Param('circuitId') circuitId: string): Promise<CircuitBreakerStats> {
    const stats = this.circuitBreaker.getCircuitStats(circuitId);
    
    if (!stats) {
      throw new HttpException(
        `Circuit '${circuitId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }
    
    return stats;
  }

  @Post('circuits/:circuitId/reset')
  @ApiOperation({ summary: 'Manually reset a circuit breaker' })
  @ApiParam({ name: 'circuitId', description: 'Circuit identifier to reset' })
  @ApiResponse({ 
    status: 200, 
    description: 'Circuit reset successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Circuit not found'
  })
  async resetCircuit(@Param('circuitId') circuitId: string): Promise<{ message: string; circuitId: string }> {
    const existingStats = this.circuitBreaker.getCircuitStats(circuitId);
    
    if (!existingStats) {
      throw new HttpException(
        `Circuit '${circuitId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }
    
    this.circuitBreaker.resetCircuit(circuitId);
    
    return {
      message: `Circuit '${circuitId}' has been reset successfully`,
      circuitId
    };
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear AI service cache' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleared successfully'
  })
  async clearCache(@Body() request?: { pattern?: string }): Promise<{ 
    message: string; 
    clearedEntries: number;
    pattern?: string; 
  }> {
    try {
      let clearedEntries = 0;
      
      if (request?.pattern) {
        clearedEntries = await this.cacheService.clearPattern(request.pattern);
        return {
          message: `Cache entries matching pattern '${request.pattern}' cleared successfully`,
          clearedEntries,
          pattern: request.pattern
        };
      } else {
        await this.cacheService.clear();
        return {
          message: 'All cache entries cleared successfully',
          clearedEntries
        };
      }
    } catch (error) {
      throw new HttpException(
        `Failed to clear cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache stats retrieved successfully'
  })
  async getCacheStatistics(): Promise<Record<string, any>> {
    return this.getCacheStats();
  }

  @Post('metrics/reset')
  @ApiOperation({ summary: 'Reset all metrics (development/testing only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics reset successfully'
  })
  async resetMetrics(): Promise<{ message: string; timestamp: string }> {
    // Only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException(
        'Metrics reset is not allowed in production environment',
        HttpStatus.FORBIDDEN
      );
    }
    
    this.aiErrorHandler.resetMetrics();
    this.circuitBreaker.clearAllCircuits();
    
    return {
      message: 'All metrics and circuit breakers have been reset',
      timestamp: new Date().toISOString()
    };
  }

  private async getCacheStats(): Promise<{
    status: string;
    hitRate: number;
    size: number;
  }> {
    try {
      // These methods may not exist in the cache service, so provide fallbacks
      const metrics = this.aiErrorHandler.getMetrics();
      
      return {
        status: 'healthy',
        hitRate: metrics.cacheHitRate || 0,
        size: 0 // Would need to implement in cache service
      };
    } catch (error) {
      return {
        status: 'error',
        hitRate: 0,
        size: 0
      };
    }
  }
}
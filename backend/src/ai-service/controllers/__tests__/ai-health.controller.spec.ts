import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AIHealthController } from '../ai-health.controller';
import { AIErrorHandlerService } from '../../services/ai-error-handler.service';
import { CircuitBreakerService, CircuitState } from '../../services/circuit-breaker.service';
import { CacheService } from '../../services/cache.service';

describe('AIHealthController', () => {
  let controller: AIHealthController;
  let errorHandler: jest.Mocked<AIErrorHandlerService>;
  let circuitBreaker: jest.Mocked<CircuitBreakerService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockErrorHandler = {
      getMetrics: jest.fn(),
      isSystemHealthy: jest.fn(),
      generateHealthReport: jest.fn(),
      getRecentErrors: jest.fn(),
      resetMetrics: jest.fn(),
    };

    const mockCircuitBreaker = {
      getAllCircuitStats: jest.fn(),
      getSystemHealth: jest.fn(),
      getCircuitStats: jest.fn(),
      resetCircuit: jest.fn(),
      clearAllCircuits: jest.fn(),
    };

    const mockCacheService = {
      clear: jest.fn(),
      clearPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIHealthController],
      providers: [
        { provide: AIErrorHandlerService, useValue: mockErrorHandler },
        { provide: CircuitBreakerService, useValue: mockCircuitBreaker },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    controller = module.get<AIHealthController>(AIHealthController);
    errorHandler = module.get(AIErrorHandlerService);
    circuitBreaker = module.get(CircuitBreakerService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when system is healthy', async () => {
      const mockMetrics = {
        successRate: 0.98,
        averageResponseTime: 1200,
        errorRate: 0.02,
        cacheHitRate: 0.85,
        providerHealth: { huggingface: true },
        lastUpdate: new Date()
      };

      const mockCircuits = {
        'huggingface-content': {
          state: CircuitState.CLOSED,
          failureCount: 0,
          successCount: 10,
          lastFailureTime: undefined,
          lastSuccessTime: new Date(),
          totalRequests: 10,
          failureRate: 0,
          isHealthy: true
        }
      };

      const mockSystemHealth = {
        healthy: true,
        openCircuits: [],
        unhealthyCircuits: [],
        totalCircuits: 1,
        summary: {}
      };

      const mockHealthReport = {
        metrics: mockMetrics,
        recommendations: ['System is performing well']
      };

      errorHandler.getMetrics.mockReturnValue(mockMetrics);
      circuitBreaker.getAllCircuitStats.mockReturnValue(mockCircuits);
      circuitBreaker.getSystemHealth.mockReturnValue(mockSystemHealth);
      errorHandler.isSystemHealthy.mockResolvedValue(true);
      errorHandler.generateHealthReport.mockReturnValue(mockHealthReport);

      const result = await controller.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.metrics).toEqual(mockMetrics);
      expect(result.circuits).toEqual(mockCircuits);
      expect(result.recommendations).toContain('System is performing well');
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy status when system is unhealthy', async () => {
      const mockMetrics = {
        successRate: 0.6,
        averageResponseTime: 5000,
        errorRate: 0.4,
        cacheHitRate: 0.2,
        providerHealth: { huggingface: false },
        lastUpdate: new Date()
      };

      const mockSystemHealth = {
        healthy: false,
        openCircuits: ['huggingface-content'],
        unhealthyCircuits: ['huggingface-content'],
        totalCircuits: 1,
        summary: {}
      };

      errorHandler.getMetrics.mockReturnValue(mockMetrics);
      errorHandler.isSystemHealthy.mockResolvedValue(false);
      circuitBreaker.getSystemHealth.mockReturnValue(mockSystemHealth);
      errorHandler.generateHealthReport.mockReturnValue({
        metrics: mockMetrics,
        recommendations: ['System needs attention']
      });

      const result = await controller.getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain('System needs attention');
    });

    it('should return degraded status for borderline performance', async () => {
      const mockMetrics = {
        successRate: 0.93, // Below 95% but above 80%
        averageResponseTime: 3500, // Above 3000ms
        errorRate: 0.07,
        cacheHitRate: 0.5,
        providerHealth: { huggingface: true },
        lastUpdate: new Date()
      };

      const mockSystemHealth = {
        healthy: true,
        openCircuits: [],
        unhealthyCircuits: [],
        totalCircuits: 1,
        summary: {}
      };

      errorHandler.getMetrics.mockReturnValue(mockMetrics);
      errorHandler.isSystemHealthy.mockResolvedValue(true);
      circuitBreaker.getSystemHealth.mockReturnValue(mockSystemHealth);
      errorHandler.generateHealthReport.mockReturnValue({
        metrics: mockMetrics,
        recommendations: []
      });

      const result = await controller.getHealthStatus();

      expect(result.status).toBe('degraded');
    });

    it('should handle errors gracefully', async () => {
      errorHandler.getMetrics.mockImplementation(() => {
        throw new Error('Metrics service failed');
      });

      await expect(controller.getHealthStatus()).rejects.toThrow(HttpException);
      await expect(controller.getHealthStatus()).rejects.toThrow('Failed to retrieve health status');
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', async () => {
      const mockMetrics = {
        successRate: 0.95,
        averageResponseTime: 1500,
        errorRate: 0.05,
        cacheHitRate: 0.8,
        providerHealth: { huggingface: true },
        lastUpdate: new Date()
      };

      errorHandler.getMetrics.mockReturnValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(errorHandler.getMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorAnalytics', () => {
    it('should return comprehensive error analytics', async () => {
      const mockErrors = [
        {
          provider: 'huggingface',
          endpoint: 'generate-content',
          errorType: 'RATE_LIMIT' as const,
          message: 'Rate limit exceeded',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          statusCode: 429
        },
        {
          provider: 'huggingface',
          endpoint: 'generate-content',
          errorType: 'TIMEOUT' as const,
          message: 'Request timeout',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          statusCode: undefined
        }
      ];

      errorHandler.getRecentErrors.mockReturnValue(mockErrors);
      circuitBreaker.getAllCircuitStats.mockReturnValue({});

      const result = await controller.getErrorAnalytics();

      expect(result.recentErrors).toHaveLength(2);
      expect(result.errorsByType).toEqual({
        'RATE_LIMIT': 1,
        'TIMEOUT': 1
      });
      expect(result.errorsByProvider).toEqual({
        'huggingface': 2
      });
      expect(result.trends).toBeDefined();
      expect(result.trends.hourly).toBeDefined();
      expect(result.trends.daily).toBeDefined();
      expect(result.criticalIssues).toBeInstanceOf(Array);
    });

    it('should identify critical issues', async () => {
      const mockErrors = Array.from({ length: 15 }, (_, i) => ({
        provider: 'huggingface',
        endpoint: 'generate-content',
        errorType: 'RATE_LIMIT' as const,
        message: `Rate limit exceeded ${i}`,
        timestamp: new Date(),
        statusCode: 429
      }));

      const mockCircuits = {
        'test-circuit': {
          state: CircuitState.OPEN,
          failureCount: 10,
          successCount: 0,
          totalRequests: 10,
          failureRate: 1,
          isHealthy: false
        }
      };

      const mockMetrics = {
        successRate: 0.7, // Below 80%
        averageResponseTime: 1000,
        errorRate: 0.3,
        cacheHitRate: 0.5,
        providerHealth: {},
        lastUpdate: new Date()
      };

      errorHandler.getRecentErrors.mockReturnValue(mockErrors);
      circuitBreaker.getAllCircuitStats.mockReturnValue(mockCircuits);
      errorHandler.getMetrics.mockReturnValue(mockMetrics);

      const result = await controller.getErrorAnalytics();

      expect(result.criticalIssues).toContain('Circuit breaker OPEN for test-circuit');
      expect(result.criticalIssues).toContain('High number of rate limit errors detected');
      expect(result.criticalIssues).toContain(expect.stringMatching(/Low success rate/));
    });
  });

  describe('getCircuitStats', () => {
    it('should return all circuit stats', async () => {
      const mockCircuits = {
        'circuit1': {
          state: CircuitState.CLOSED,
          failureCount: 0,
          successCount: 5,
          totalRequests: 5,
          failureRate: 0,
          isHealthy: true
        },
        'circuit2': {
          state: CircuitState.OPEN,
          failureCount: 8,
          successCount: 2,
          totalRequests: 10,
          failureRate: 0.8,
          isHealthy: false
        }
      };

      circuitBreaker.getAllCircuitStats.mockReturnValue(mockCircuits);

      const result = await controller.getCircuitStats();

      expect(result).toEqual(mockCircuits);
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe('getCircuitStatus', () => {
    it('should return specific circuit stats', async () => {
      const mockStats = {
        state: CircuitState.CLOSED,
        failureCount: 2,
        successCount: 8,
        totalRequests: 10,
        failureRate: 0.2,
        isHealthy: true
      };

      circuitBreaker.getCircuitStats.mockReturnValue(mockStats);

      const result = await controller.getCircuitStatus('test-circuit');

      expect(result).toEqual(mockStats);
      expect(circuitBreaker.getCircuitStats).toHaveBeenCalledWith('test-circuit');
    });

    it('should throw 404 for non-existent circuit', async () => {
      circuitBreaker.getCircuitStats.mockReturnValue(null);

      await expect(controller.getCircuitStatus('non-existent'))
        .rejects.toThrow(HttpException);
      
      try {
        await controller.getCircuitStatus('non-existent');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(error.message).toContain('non-existent');
      }
    });
  });

  describe('resetCircuit', () => {
    it('should reset existing circuit', async () => {
      const mockStats = {
        state: CircuitState.OPEN,
        failureCount: 5,
        successCount: 0,
        totalRequests: 5,
        failureRate: 1,
        isHealthy: false
      };

      circuitBreaker.getCircuitStats.mockReturnValue(mockStats);
      circuitBreaker.resetCircuit.mockImplementation(() => {});

      const result = await controller.resetCircuit('test-circuit');

      expect(result.message).toContain('reset successfully');
      expect(result.circuitId).toBe('test-circuit');
      expect(circuitBreaker.resetCircuit).toHaveBeenCalledWith('test-circuit');
    });

    it('should throw 404 for non-existent circuit', async () => {
      circuitBreaker.getCircuitStats.mockReturnValue(null);

      await expect(controller.resetCircuit('non-existent'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache when no pattern provided', async () => {
      cacheService.clear.mockResolvedValue(undefined);

      const result = await controller.clearCache();

      expect(result.message).toContain('All cache entries cleared');
      expect(cacheService.clear).toHaveBeenCalledTimes(1);
    });

    it('should clear cache by pattern when pattern provided', async () => {
      cacheService.clearPattern.mockResolvedValue(5);

      const result = await controller.clearCache({ pattern: 'test-*' });

      expect(result.message).toContain("pattern 'test-*' cleared");
      expect(result.clearedEntries).toBe(5);
      expect(result.pattern).toBe('test-*');
      expect(cacheService.clearPattern).toHaveBeenCalledWith('test-*');
    });

    it('should handle cache service errors', async () => {
      cacheService.clear.mockRejectedValue(new Error('Cache service failed'));

      await expect(controller.clearCache()).rejects.toThrow(HttpException);
    });
  });

  describe('getCacheStatistics', () => {
    it('should return cache statistics', async () => {
      const mockMetrics = {
        cacheHitRate: 0.85,
        successRate: 0.95,
        averageResponseTime: 1000,
        errorRate: 0.05,
        providerHealth: {},
        lastUpdate: new Date()
      };

      errorHandler.getMetrics.mockReturnValue(mockMetrics);

      const result = await controller.getCacheStatistics();

      expect(result.status).toBe('healthy');
      expect(result.hitRate).toBe(0.85);
    });
  });

  describe('resetMetrics', () => {
    beforeEach(() => {
      // Mock environment to be non-production
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should reset metrics in non-production environment', async () => {
      errorHandler.resetMetrics.mockImplementation(() => {});
      circuitBreaker.clearAllCircuits.mockImplementation(() => {});

      const result = await controller.resetMetrics();

      expect(result.message).toContain('reset');
      expect(result.timestamp).toBeDefined();
      expect(errorHandler.resetMetrics).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.clearAllCircuits).toHaveBeenCalledTimes(1);
    });

    it('should forbid reset in production environment', async () => {
      process.env.NODE_ENV = 'production';

      await expect(controller.resetMetrics()).rejects.toThrow(HttpException);
      
      try {
        await controller.resetMetrics();
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
        expect(error.message).toContain('production');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors in getHealthStatus', async () => {
      errorHandler.getMetrics.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(controller.getHealthStatus()).rejects.toThrow(HttpException);
    });

    it('should handle cache service errors gracefully', async () => {
      cacheService.clear.mockRejectedValue(new Error('Cache unavailable'));

      await expect(controller.clearCache()).rejects.toThrow(HttpException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { AIErrorHandlerService, AIError, ErrorRecoveryStrategy } from '../ai-error-handler.service';

describe('AIErrorHandlerService', () => {
  let service: AIErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIErrorHandlerService],
    }).compile();

    service = module.get<AIErrorHandlerService>(AIErrorHandlerService);
  });

  afterEach(() => {
    service.resetMetrics();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAIError', () => {
    it('should categorize rate limit errors correctly', async () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Rate limit exceeded'
      };

      const strategy = await service.handleAIError(rateLimitError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 1,
        maxAttempts: 3
      });

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.fallbackAction).toBe('RETRY_WITH_DIFFERENT_PROVIDER');
      expect(strategy.retryDelay).toBeGreaterThan(0);
    });

    it('should categorize timeout errors correctly', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      const strategy = await service.handleAIError(timeoutError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 1,
        maxAttempts: 3
      });

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.fallbackAction).toBe('RETRY_WITH_DIFFERENT_PROVIDER');
    });

    it('should categorize network errors correctly', async () => {
      const networkError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND'
      };

      const strategy = await service.handleAIError(networkError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 1,
        maxAttempts: 3
      });

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.fallbackAction).toBe('USE_CACHE');
      expect(strategy.maxRetries).toBe(2); // Network errors have fewer retries
    });

    it('should not retry on 4xx client errors', async () => {
      const clientError = {
        response: { status: 400 },
        message: 'Bad request'
      };

      const strategy = await service.handleAIError(clientError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 1,
        maxAttempts: 3
      });

      expect(strategy.shouldRetry).toBe(false);
      expect(strategy.fallbackAction).toBe('USE_FALLBACK');
    });

    it('should apply exponential backoff for rate limits', async () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Rate limit exceeded'
      };

      const strategy1 = await service.handleAIError(rateLimitError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 1,
        maxAttempts: 3
      });

      const strategy2 = await service.handleAIError(rateLimitError, {
        provider: 'huggingface',
        endpoint: 'generate-content',
        attempt: 2,
        maxAttempts: 3
      });

      expect(strategy2.retryDelay).toBeGreaterThan(strategy1.retryDelay);
    });

    it('should update provider health status on error', async () => {
      const error = {
        response: { status: 500 },
        message: 'Internal server error'
      };

      await service.handleAIError(error, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      expect(service.getProviderHealth('huggingface')).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('should update metrics on success', () => {
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1500,
        fromCache: false
      });

      const metrics = service.getMetrics();
      expect(metrics.successRate).toBe(1);
      expect(metrics.averageResponseTime).toBe(1500);
      expect(service.getProviderHealth('huggingface')).toBe(true);
    });

    it('should track cache hits correctly', () => {
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 50,
        fromCache: true
      });

      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000,
        fromCache: false
      });

      const metrics = service.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('getMetrics', () => {
    it('should return correct success rate after mixed results', async () => {
      // Record successes
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1200
      });

      // Record failure
      await service.handleAIError({ message: 'Error' }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      const metrics = service.getMetrics();
      expect(metrics.successRate).toBeCloseTo(0.67, 2); // 2/3 success rate
      expect(metrics.errorRate).toBeCloseTo(0.33, 2); // 1/3 error rate
    });

    it('should calculate average response time correctly', () => {
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 2000
      });

      const metrics = service.getMetrics();
      expect(metrics.averageResponseTime).toBe(1500);
    });
  });

  describe('isSystemHealthy', () => {
    it('should return true for healthy system', async () => {
      // Record several successes
      for (let i = 0; i < 5; i++) {
        service.recordSuccess({
          provider: 'huggingface',
          endpoint: 'generate-content',
          responseTime: 1000
        });
      }

      const isHealthy = await service.isSystemHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should return false for unhealthy system with too many recent errors', async () => {
      // Record many recent errors
      for (let i = 0; i < 6; i++) {
        await service.handleAIError({ message: 'Error' }, {
          provider: 'huggingface',
          endpoint: 'generate-content'
        });
      }

      const isHealthy = await service.isSystemHealthy();
      expect(isHealthy).toBe(false);
    });

    it('should return false for system with low success rate', async () => {
      // Record many failures relative to successes
      for (let i = 0; i < 10; i++) {
        await service.handleAIError({ message: 'Error' }, {
          provider: 'huggingface',
          endpoint: 'generate-content'
        });
      }

      // Only 2 successes out of 12 total
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      const isHealthy = await service.isSystemHealthy();
      expect(isHealthy).toBe(false);
    });
  });

  describe('generateHealthReport', () => {
    it('should provide comprehensive health report', async () => {
      // Setup mixed scenario
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      await service.handleAIError({ response: { status: 429 } }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      await service.handleAIError({ code: 'ETIMEDOUT' }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      const report = service.generateHealthReport();

      expect(report.metrics).toBeDefined();
      expect(report.errorsByType).toBeDefined();
      expect(report.errorsByProvider).toBeDefined();
      expect(report.systemHealth).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);

      expect(report.errorsByType['RATE_LIMIT']).toBe(1);
      expect(report.errorsByType['TIMEOUT']).toBe(1);
      expect(report.errorsByProvider['huggingface']).toBe(2);
    });

    it('should generate relevant recommendations', async () => {
      // Create scenario with rate limit errors
      for (let i = 0; i < 6; i++) {
        await service.handleAIError({ response: { status: 429 } }, {
          provider: 'huggingface',
          endpoint: 'generate-content'
        });
      }

      const report = service.generateHealthReport();

      expect(report.recommendations).toContain(
        expect.stringMatching(/rate limit.*detected/i)
      );
    });
  });

  describe('getRecentErrors', () => {
    it('should return recent errors in order', async () => {
      await service.handleAIError({ message: 'Error 1' }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      await service.handleAIError({ message: 'Error 2' }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      const recentErrors = service.getRecentErrors(10);
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe('Error 1');
      expect(recentErrors[1].message).toBe('Error 2');
    });

    it('should limit returned errors to specified count', async () => {
      // Generate more errors than limit
      for (let i = 0; i < 10; i++) {
        await service.handleAIError({ message: `Error ${i}` }, {
          provider: 'huggingface',
          endpoint: 'generate-content'
        });
      }

      const recentErrors = service.getRecentErrors(5);
      expect(recentErrors).toHaveLength(5);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to initial state', async () => {
      // Generate some activity
      service.recordSuccess({
        provider: 'huggingface',
        endpoint: 'generate-content',
        responseTime: 1000
      });

      await service.handleAIError({ message: 'Error' }, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      // Reset
      service.resetMetrics();

      const metrics = service.getMetrics();
      expect(metrics.successRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(Object.keys(metrics.providerHealth)).toHaveLength(0);
      expect(service.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('Error categorization edge cases', () => {
    it('should handle unknown error types', async () => {
      const unknownError = {
        message: 'Some unknown error'
      };

      const strategy = await service.handleAIError(unknownError, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.fallbackAction).toBe('USE_CACHE');
    });

    it('should handle errors without message', async () => {
      const errorWithoutMessage = {};

      const strategy = await service.handleAIError(errorWithoutMessage, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      expect(strategy).toBeDefined();
    });

    it('should handle null/undefined errors gracefully', async () => {
      const strategy1 = await service.handleAIError(null, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      const strategy2 = await service.handleAIError(undefined, {
        provider: 'huggingface',
        endpoint: 'generate-content'
      });

      expect(strategy1).toBeDefined();
      expect(strategy2).toBeDefined();
    });
  });
});
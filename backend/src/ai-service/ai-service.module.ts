import { Module, OnModuleInit } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { AiServiceController } from './ai-service.controller';
import { ContentGeneratorService } from './services/content-generator.service';
import { MedicalValidatorService } from './services/medical-validator.service';
import { RetryService } from './services/retry.service';
import { CacheService } from './services/cache.service';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { AIErrorHandlerService } from './services/ai-error-handler.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { AIHealthController } from './controllers/ai-health.controller';
import { cacheConfig } from './config/cache.config';

@Module({
  imports: [cacheConfig],
  controllers: [AiServiceController, AIHealthController],
  providers: [
    AiServiceService,
    ContentGeneratorService,
    MedicalValidatorService,
    RetryService,
    CacheService,
    HuggingFaceProvider,
    AIErrorHandlerService,
    CircuitBreakerService,
  ],
  exports: [AiServiceService, AIErrorHandlerService, CircuitBreakerService],
})
export class AiServiceModule implements OnModuleInit {
  constructor(
    private readonly cacheService: CacheService,
    private readonly circuitBreaker: CircuitBreakerService
  ) {}

  async onModuleInit() {
    // Pre-warm cache with common provider explanations for instant responses
    await this.cacheService.preWarmProviderExplanations();
    
    // Initialize circuit breakers for AI providers
    this.circuitBreaker.registerCircuit('huggingface-content-generation', {
      failureThreshold: 0.6,
      resetTimeout: 60000, // 1 minute
      monitoringWindow: 120000, // 2 minutes
      minimumThroughput: 5
    });
    
    this.circuitBreaker.registerCircuit('huggingface-provider-explanation', {
      failureThreshold: 0.5,
      resetTimeout: 45000, // 45 seconds
      monitoringWindow: 90000, // 1.5 minutes
      minimumThroughput: 3
    });
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;

  constructor(private configService: ConfigService) {
    this.maxAttempts = this.configService.get<number>('AI_RETRY_MAX_ATTEMPTS', 3);
    this.baseDelayMs = this.configService.get<number>('AI_RETRY_DELAY_MS', 1000);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    isRetriableError: (error: any) => boolean = this.defaultRetriableErrorCheck,
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        this.logger.debug(`${context} - Attempt ${attempt}/${this.maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxAttempts || !isRetriableError(error)) {
          this.logger.error(`${context} - Final failure on attempt ${attempt}: ${error.message}`);
          throw error;
        }
        
        const delayMs = this.calculateBackoffDelay(attempt);
        this.logger.warn(`${context} - Attempt ${attempt} failed, retrying in ${delayMs}ms: ${error.message}`);
        
        await this.delay(delayMs);
      }
    }
    
    throw lastError;
  }

  private calculateBackoffDelay(attempt: number): number {
    const jitter = Math.random() * 0.1;
    const backoffMultiplier = Math.pow(2, attempt - 1);
    return Math.floor(this.baseDelayMs * backoffMultiplier * (1 + jitter));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private defaultRetriableErrorCheck(error: any): boolean {
    if (!error) return false;
    
    const retriableErrorCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ];
    
    const retriableStatusCodes = [429, 500, 502, 503, 504];
    
    if (error.code && retriableErrorCodes.includes(error.code)) {
      return true;
    }
    
    if (error.status && retriableStatusCodes.includes(error.status)) {
      return true;
    }
    
    if (error.response?.status && retriableStatusCodes.includes(error.response.status)) {
      return true;
    }
    
    if (error.message?.includes('timeout')) {
      return true;
    }
    
    if (error.message?.includes('rate limit')) {
      return true;
    }
    
    return false;
  }
}
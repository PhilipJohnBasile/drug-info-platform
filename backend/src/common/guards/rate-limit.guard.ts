import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../redis/redis.service';
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
  keyGenerator?: (req: Request) => string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting applied
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, rateLimitOptions);

    const result = await this.checkRateLimit(key, rateLimitOptions);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          limit: rateLimitOptions.points,
          remaining: 0,
          reset: result.resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', rateLimitOptions.points);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetTime);

    return true;
  }

  private generateKey(
    request: Request,
    options: RateLimitOptions,
  ): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default key generation based on IP and endpoint
    const ip = this.getClientIP(request);
    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    return `rate_limit:${ip}:${endpoint}`;
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private async checkRateLimit(
    key: string,
    options: RateLimitOptions,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - options.duration * 1000;

    try {
      // Check Redis availability first to avoid client initialization errors
      // Check if Redis is available before using it
      if (!this.redisService.isHealthy()) {
        // Redis is not available, fail open - allow request
        return {
          allowed: true,
          remaining: options.points - 1,
          resetTime: now + options.duration * 1000,
        };
      }

      // Use Redis sorted set to track requests in time window
      const client = this.redisService.getClient();
      if (!client) {
        // Redis client not available, fail open
        return {
          allowed: true,
          remaining: options.points - 1,
          resetTime: now + options.duration * 1000,
        };
      }
      const pipeline = client.pipeline();
      
      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, now);
      
      // Set expiry
      pipeline.expire(key, options.duration);
      
      const results = await pipeline.exec();
      const currentCount = results?.[1]?.[1] as number || 0;

      const remaining = Math.max(0, options.points - currentCount - 1);
      const resetTime = now + options.duration * 1000;

      if (currentCount >= options.points) {
        return {
          allowed: false,
          remaining: 0,
          retryAfter: options.blockDuration || options.duration,
          resetTime,
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: options.points - 1,
        resetTime: now + options.duration * 1000,
      };
    }
  }
}

// Decorator for different rate limit types
export const StandardRateLimit = () =>
  RateLimit({
    points: 1000, // 1000 requests
    duration: 3600, // per hour
  });

export const SearchRateLimit = () =>
  RateLimit({
    points: 500, // 500 requests
    duration: 3600, // per hour
  });

export const AIRateLimit = () =>
  RateLimit({
    points: 100, // 100 requests
    duration: 3600, // per hour
    blockDuration: 300, // Block for 5 minutes
  });

export const StrictRateLimit = () =>
  RateLimit({
    points: 10, // 10 requests
    duration: 60, // per minute
    blockDuration: 300, // Block for 5 minutes
  });
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const cacheConfig = CacheModule.registerAsync({
  useFactory: async (configService: ConfigService) => {
    // Use in-memory cache for demo - Redis authentication disabled
    console.log('Using in-memory cache for demo purposes');
    return {
      ttl: configService.get<number>('AI_CACHE_TTL', 3600),
      max: 100,
    };
  },
  inject: [ConfigService],
  isGlobal: true,
});
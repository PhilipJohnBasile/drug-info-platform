import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { DrugsModule } from './drugs/drugs.module';
import { AiServiceModule } from './ai-service/ai-service.module';
import { McpModule } from './mcp/mcp.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    DrugsModule,
    AiServiceModule,
    McpModule,
    HealthModule,
  ],
})
export class AppModule {}
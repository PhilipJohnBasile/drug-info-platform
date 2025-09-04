import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async checkHealth() {
    const timestamp = new Date().toISOString()
    
    try {
      const dbHealth = await this.checkDatabase()
      const redisHealth = await this.checkRedis()
      
      const status = dbHealth.status === 'healthy' && redisHealth.status === 'healthy' 
        ? 'healthy' 
        : 'unhealthy'

      return {
        status,
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: dbHealth,
          redis: redisHealth
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }
      }
    } catch (error) {
      this.logger.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        timestamp,
        error: error.message,
        uptime: process.uptime()
      }
    }
  }

  async checkReadiness() {
    try {
      // Check if all dependencies are ready
      const dbReady = await this.isDatabaseReady()
      const redisReady = await this.isRedisReady()
      
      const ready = dbReady && redisReady
      
      return {
        status: ready ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbReady ? 'ready' : 'not ready',
          redis: redisReady ? 'ready' : 'not ready'
        }
      }
    } catch (error) {
      this.logger.error('Readiness check failed:', error)
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  async checkLiveness() {
    // Simple liveness check - just verify the service is running
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid
    }
  }

  private async checkDatabase() {
    try {
      const start = Date.now()
      await this.prisma.$queryRaw`SELECT 1`
      const duration = Date.now() - start
      
      return {
        status: 'healthy',
        responseTime: `${duration}ms`
      }
    } catch (error) {
      this.logger.error('Database health check failed:', error)
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now()
      await this.redis.ping()
      const duration = Date.now() - start
      
      return {
        status: 'healthy',
        responseTime: `${duration}ms`
      }
    } catch (error) {
      this.logger.error('Redis health check failed:', error)
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  private async isRedisReady(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }
}
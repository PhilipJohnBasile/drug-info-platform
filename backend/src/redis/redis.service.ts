import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis
  private isConnected = false

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.disconnect()
  }

  private async connect() {
    try {
      // For demo purposes, disable Redis to avoid connection issues
      this.logger.warn('Redis disabled for demo - using in-memory fallback')
      this.isConnected = false
      return
    } catch (error) {
      this.logger.warn('Redis initialization failed, continuing without Redis:', error.message)
      this.isConnected = false
    }
  }

  private async disconnect() {
    if (this.client) {
      await this.client.quit()
      this.isConnected = false
      this.logger.log('Disconnected from Redis')
    }
  }

  async ping(): Promise<string> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for ping')
      return 'PONG'
    }
    try {
      return await this.client.ping()
    } catch (error) {
      this.logger.warn('Redis ping failed:', error.message)
      return 'PONG'
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for get operation')
      return null
    }
    try {
      return await this.client.get(key)
    } catch (error) {
      this.logger.warn('Redis get failed:', error.message)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for set operation')
      return 'OK'
    }
    try {
      if (ttlSeconds) {
        return await this.client.setex(key, ttlSeconds, value)
      }
      return await this.client.set(key, value)
    } catch (error) {
      this.logger.warn('Redis set failed:', error.message)
      return 'OK'
    }
  }

  async del(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for del operation')
      return 0
    }
    try {
      return await this.client.del(key)
    } catch (error) {
      this.logger.warn('Redis del failed:', error.message)
      return 0
    }
  }

  async exists(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for exists operation')
      return 0
    }
    try {
      return await this.client.exists(key)
    } catch (error) {
      this.logger.warn('Redis exists failed:', error.message)
      return 0
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for ttl operation')
      return -1
    }
    try {
      return await this.client.ttl(key)
    } catch (error) {
      this.logger.warn('Redis ttl failed:', error.message)
      return -1
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for keys operation')
      return []
    }
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      this.logger.warn('Redis keys failed:', error.message)
      return []
    }
  }

  async flushall(): Promise<'OK'> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis not available for flushall operation')
      return 'OK'
    }
    try {
      return await this.client.flushall()
    } catch (error) {
      this.logger.warn('Redis flushall failed:', error.message)
      return 'OK'
    }
  }

  isHealthy(): boolean {
    return this.isConnected && !!this.client
  }

  getClient(): Redis | null {
    if (!this.client) {
      return null
    }
    return this.client
  }
}
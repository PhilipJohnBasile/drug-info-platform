import { Injectable, Logger } from '@nestjs/common';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
  minimumThroughput: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  failureRate: number;
  isHealthy: boolean;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits = new Map<string, {
    config: CircuitBreakerConfig;
    stats: CircuitBreakerStats;
    requestHistory: Array<{ timestamp: Date; success: boolean }>;
  }>();

  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 0.5, // 50% failure rate triggers circuit
    resetTimeout: 30000,   // 30 seconds before trying again
    monitoringWindow: 60000, // 1 minute window for tracking failures
    minimumThroughput: 10    // Minimum requests before circuit can trip
  };

  registerCircuit(
    circuitId: string, 
    config: Partial<CircuitBreakerConfig> = {}
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.circuits.set(circuitId, {
      config: finalConfig,
      stats: {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        failureRate: 0,
        isHealthy: true
      },
      requestHistory: []
    });

    this.logger.log(`Circuit breaker registered for ${circuitId}`, finalConfig);
  }

  async executeWithCircuitBreaker<T>(
    circuitId: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(circuitId);
    
    // Check if circuit is open
    if (circuit.stats.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit)) {
        circuit.stats.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit ${circuitId} moved to HALF_OPEN state`);
      } else {
        this.logger.warn(`Circuit ${circuitId} is OPEN, failing fast`);
        
        if (fallback) {
          return await fallback();
        }
        
        throw new Error(`Circuit breaker is OPEN for ${circuitId}`);
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Record success
      this.recordSuccess(circuitId, Date.now() - startTime);
      
      // If we were in HALF_OPEN state, move to CLOSED
      if (circuit.stats.state === CircuitState.HALF_OPEN) {
        circuit.stats.state = CircuitState.CLOSED;
        this.logger.log(`Circuit ${circuitId} moved to CLOSED state after successful recovery`);
      }
      
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(circuitId, error);
      
      // Check if circuit should trip
      this.evaluateCircuitState(circuitId);
      
      // Get the current circuit state after evaluation (it may have changed)
      const currentState = circuit.stats.state as CircuitState;
      
      // If we have a fallback and circuit is now open, use it
      if (fallback && currentState === CircuitState.OPEN) {
        this.logger.warn(`Using fallback for ${circuitId} due to circuit breaker`);
        return await fallback();
      }
      
      throw error;
    }
  }

  getCircuitStats(circuitId: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitId);
    return circuit ? { ...circuit.stats } : null;
  }

  getAllCircuitStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    this.circuits.forEach((circuit, circuitId) => {
      stats[circuitId] = { ...circuit.stats };
    });
    
    return stats;
  }

  resetCircuit(circuitId: string): void {
    const circuit = this.circuits.get(circuitId);
    if (circuit) {
      circuit.stats = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        failureRate: 0,
        isHealthy: true
      };
      circuit.requestHistory = [];
      
      this.logger.log(`Circuit ${circuitId} has been manually reset`);
    }
  }

  isCircuitOpen(circuitId: string): boolean {
    const circuit = this.circuits.get(circuitId);
    return circuit ? circuit.stats.state === CircuitState.OPEN : false;
  }

  isCircuitHealthy(circuitId: string): boolean {
    const circuit = this.circuits.get(circuitId);
    return circuit ? circuit.stats.isHealthy : true;
  }

  private getOrCreateCircuit(circuitId: string) {
    if (!this.circuits.has(circuitId)) {
      this.registerCircuit(circuitId);
    }
    return this.circuits.get(circuitId)!;
  }

  private recordSuccess(circuitId: string, responseTime: number): void {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return;

    circuit.stats.successCount++;
    circuit.stats.totalRequests++;
    circuit.stats.lastSuccessTime = new Date();
    circuit.stats.isHealthy = true;

    // Add to history
    circuit.requestHistory.push({
      timestamp: new Date(),
      success: true
    });

    this.cleanupOldHistory(circuit);
    this.updateFailureRate(circuit);

    this.logger.debug(`Circuit ${circuitId} recorded success (${responseTime}ms)`);
  }

  private recordFailure(circuitId: string, error: any): void {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return;

    circuit.stats.failureCount++;
    circuit.stats.totalRequests++;
    circuit.stats.lastFailureTime = new Date();

    // Add to history
    circuit.requestHistory.push({
      timestamp: new Date(),
      success: false
    });

    this.cleanupOldHistory(circuit);
    this.updateFailureRate(circuit);

    this.logger.warn(`Circuit ${circuitId} recorded failure: ${error.message}`);
  }

  private evaluateCircuitState(circuitId: string): void {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) return;

    const config = circuit.config;
    const stats = circuit.stats;

    // Don't trip circuit if we haven't reached minimum throughput
    if (stats.totalRequests < config.minimumThroughput) {
      return;
    }

    // Check if failure rate exceeds threshold
    if (stats.failureRate >= config.failureThreshold) {
      if (stats.state === CircuitState.CLOSED || stats.state === CircuitState.HALF_OPEN) {
        stats.state = CircuitState.OPEN;
        stats.isHealthy = false;
        
        this.logger.error(
          `Circuit ${circuitId} TRIPPED - failure rate: ${(stats.failureRate * 100).toFixed(1)}%`
        );
      }
    }
  }

  private shouldAttemptReset(circuit: any): boolean {
    if (!circuit.stats.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - circuit.stats.lastFailureTime.getTime();
    return timeSinceLastFailure >= circuit.config.resetTimeout;
  }

  private cleanupOldHistory(circuit: any): void {
    const cutoffTime = new Date(Date.now() - circuit.config.monitoringWindow);
    circuit.requestHistory = circuit.requestHistory.filter(
      (entry: any) => entry.timestamp > cutoffTime
    );
  }

  private updateFailureRate(circuit: any): void {
    const recentRequests = circuit.requestHistory;
    
    if (recentRequests.length === 0) {
      circuit.stats.failureRate = 0;
      return;
    }

    const failures = recentRequests.filter((entry: any) => !entry.success).length;
    circuit.stats.failureRate = failures / recentRequests.length;
  }

  // Health check method for monitoring
  getSystemHealth(): {
    healthy: boolean;
    openCircuits: string[];
    unhealthyCircuits: string[];
    totalCircuits: number;
    summary: Record<string, any>;
  } {
    const openCircuits: string[] = [];
    const unhealthyCircuits: string[] = [];
    const summary: Record<string, any> = {};

    this.circuits.forEach((circuit, circuitId) => {
      summary[circuitId] = {
        state: circuit.stats.state,
        failureRate: Math.round(circuit.stats.failureRate * 100),
        totalRequests: circuit.stats.totalRequests,
        isHealthy: circuit.stats.isHealthy
      };

      if (circuit.stats.state === CircuitState.OPEN) {
        openCircuits.push(circuitId);
      }
      
      if (!circuit.stats.isHealthy) {
        unhealthyCircuits.push(circuitId);
      }
    });

    const healthy = openCircuits.length === 0;

    return {
      healthy,
      openCircuits,
      unhealthyCircuits,
      totalCircuits: this.circuits.size,
      summary
    };
  }

  // Cleanup method for testing
  clearAllCircuits(): void {
    this.circuits.clear();
  }
}
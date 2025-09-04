import { NextResponse } from 'next/server'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  try {
    // Check if backend is reachable
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    let backendStatus = 'unknown'
    let backendResponseTime = 0
    
    try {
      const start = Date.now()
      const response = await fetch(`${backendUrl}/health`, { 
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      backendResponseTime = Date.now() - start
      backendStatus = response.ok ? 'healthy' : 'unhealthy'
    } catch (error) {
      backendStatus = 'unreachable'
      console.error('Backend health check failed:', error instanceof Error ? error.message : String(error))
    }
    
    // Get system information
    const memoryUsage = process.memoryUsage()
    
    const healthData = {
      status: backendStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        backend: {
          status: backendStatus,
          responseTime: backendStatus !== 'unreachable' ? `${backendResponseTime}ms` : null,
          url: backendUrl
        }
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      }
    }
    
    return NextResponse.json(healthData, {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Frontend health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        error: error instanceof Error ? error.message : String(error),
        uptime: process.uptime()
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/health`, { 
      method: 'HEAD',
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(3000)
    })
    
    return new Response(null, { 
      status: response.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  } catch {
    return new Response(null, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}
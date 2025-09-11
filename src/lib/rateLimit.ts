import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configurations
export const rateLimitConfigs = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  api: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes  
  reports: { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  upload: { requests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
  default: { requests: 60, windowMs: 60 * 1000 } // 60 requests per minute
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  // Fallback to a default identifier (not ideal for production)
  return 'unknown-client'
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  config: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request)
  const key = `${clientId}:${request.nextUrl.pathname}`
  const now = Date.now()
  
  // Clean up expired entries (simple cleanup)
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [k, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // No entry or expired, create new one
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, newEntry)
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: newEntry.resetTime
    }
  }
  
  if (entry.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Rate limiting middleware helper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  configType: keyof typeof rateLimitConfigs = 'default'
) {
  return async (request: NextRequest) => {
    const config = rateLimitConfigs[configType]
    const { allowed, remaining, resetTime } = checkRateLimit(request, config)
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (resetTime / 1000).toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }
    
    // Add rate limit headers to response
    const response = await handler(request)
    
    response.headers.set('X-RateLimit-Limit', config.requests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', (resetTime / 1000).toString())
    
    return response
  }
}

/**
 * Get rate limit status for a request
 */
export function getRateLimitStatus(
  request: NextRequest,
  configType: keyof typeof rateLimitConfigs = 'default'
): { remaining: number; resetTime: number; limit: number } {
  const config = rateLimitConfigs[configType]
  const clientId = getClientId(request)
  const key = `${clientId}:${request.nextUrl.pathname}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.requests,
      resetTime: now + config.windowMs,
      limit: config.requests
    }
  }
  
  return {
    remaining: Math.max(0, config.requests - entry.count),
    resetTime: entry.resetTime,
    limit: config.requests
  }
}
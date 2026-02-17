/**
 * In-memory rate limiting for auth endpoints
 * 
 * Note: This is suitable for single-server deployments.
 * For multi-server deployments, consider using Redis or a distributed cache.
 * 
 * Rate limits are applied per IP address and per email address to prevent:
 * - Bot attacks spamming signup/password reset
 * - Account enumeration through timing attacks
 * - Email bombing a single address
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// Separate stores for different limit types
const ipLimitStore: RateLimitStore = {};
const emailLimitStore: RateLimitStore = {};

// Configuration for different rate limit types
export const RATE_LIMITS = {
  // Auth endpoints - per IP
  AUTH_PER_IP: {
    maxRequests: 10,      // Maximum requests
    windowMs: 60 * 1000,  // Per minute (60 seconds)
  },
  // Auth endpoints - per email (prevents email bombing)
  AUTH_PER_EMAIL: {
    maxRequests: 3,       // Maximum emails sent to same address
    windowMs: 5 * 60 * 1000,  // Per 5 minutes
  },
  // Resend confirmation - more strict
  RESEND_PER_EMAIL: {
    maxRequests: 2,       // Only 2 resends
    windowMs: 10 * 60 * 1000, // Per 10 minutes
  },
  // Password reset - moderate
  RESET_PER_EMAIL: {
    maxRequests: 3,       // 3 reset requests
    windowMs: 15 * 60 * 1000, // Per 15 minutes
  },
  // Signup - moderate to prevent mass account creation
  SIGNUP_PER_IP: {
    maxRequests: 5,       // 5 signups
    windowMs: 60 * 60 * 1000, // Per hour
  },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

/**
 * Clean up expired entries from the store
 */
function cleanupStore(store: RateLimitStore, windowMs: number): void {
  const now = Date.now();
  for (const key in store) {
    if (now - store[key].firstAttempt > windowMs) {
      delete store[key];
    }
  }
}

/**
 * Check rate limit for a given key
 */
function checkLimit(
  store: RateLimitStore,
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    cleanupStore(store, windowMs);
  }

  const entry = store[key];
  
  // No previous requests - allow
  if (!entry) {
    store[key] = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
      retryAfterSeconds: 0,
    };
  }

  // Window has expired - reset
  if (now - entry.firstAttempt > windowMs) {
    store[key] = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
      retryAfterSeconds: 0,
    };
  }

  // Within window - check count
  const resetAt = new Date(entry.firstAttempt + windowMs);
  const retryAfterSeconds = Math.ceil((entry.firstAttempt + windowMs - now) / 1000);

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  // Increment and allow
  entry.count++;
  entry.lastAttempt = now;
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Check rate limit by IP address
 */
export function checkIpRateLimit(
  ip: string,
  config: { maxRequests: number; windowMs: number } = RATE_LIMITS.AUTH_PER_IP
): RateLimitResult {
  const key = `ip:${ip}`;
  return checkLimit(ipLimitStore, key, config.maxRequests, config.windowMs);
}

/**
 * Check rate limit by email address
 */
export function checkEmailRateLimit(
  email: string,
  config: { maxRequests: number; windowMs: number } = RATE_LIMITS.AUTH_PER_EMAIL
): RateLimitResult {
  const normalizedEmail = email?.toLowerCase().trim() || '';
  const key = `email:${normalizedEmail}`;
  return checkLimit(emailLimitStore, key, config.maxRequests, config.windowMs);
}

/**
 * Combined rate limit check for auth operations
 * Checks both IP and email limits
 */
export function checkAuthRateLimit(
  ip: string,
  email: string,
  operation: 'signup' | 'reset' | 'resend' | 'general' = 'general'
): RateLimitResult {
  // Choose appropriate limits based on operation
  let ipConfig = RATE_LIMITS.AUTH_PER_IP;
  let emailConfig = RATE_LIMITS.AUTH_PER_EMAIL;

  switch (operation) {
    case 'signup':
      ipConfig = RATE_LIMITS.SIGNUP_PER_IP;
      emailConfig = RATE_LIMITS.AUTH_PER_EMAIL;
      break;
    case 'reset':
      emailConfig = RATE_LIMITS.RESET_PER_EMAIL;
      break;
    case 'resend':
      emailConfig = RATE_LIMITS.RESEND_PER_EMAIL;
      break;
  }

  // Check IP limit first
  const ipResult = checkIpRateLimit(ip, ipConfig);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // Then check email limit
  const emailResult = checkEmailRateLimit(email, emailConfig);
  if (!emailResult.allowed) {
    return emailResult;
  }

  // Return the more restrictive remaining count
  return {
    allowed: true,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
    resetAt: ipResult.resetAt > emailResult.resetAt ? ipResult.resetAt : emailResult.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Get client IP from request headers
 * Handles proxied requests (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  // Try various headers used by proxies/CDNs
  const headers = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',             // Nginx
    'x-forwarded-for',       // Standard proxy header
    'x-client-ip',           // Some proxies
    'true-client-ip',        // Akamai
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      const ip = value.split(',')[0]?.trim();
      if (ip && isValidIp(ip)) {
        return ip;
      }
    }
  }

  // Fallback to a default (should not happen in production)
  return '0.0.0.0';
}

/**
 * Basic IP validation
 */
function isValidIp(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(n => parseInt(n) >= 0 && parseInt(n) <= 255);
  }
  
  // IPv6 (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Format rate limit error message for user display
 */
export function formatRateLimitError(result: RateLimitResult): string {
  if (result.retryAfterSeconds <= 60) {
    return `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`;
  }
  
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  return `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
}

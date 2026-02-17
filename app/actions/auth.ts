'use server';

/**
 * Server-side auth actions with rate limiting, email validation, and CAPTCHA verification
 * These protect against abuse of email-triggering endpoints
 */

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { validateEmail, normalizeEmail } from '@/lib/validation/email';
import { 
  checkAuthRateLimit, 
  getClientIp, 
  formatRateLimitError 
} from '@/lib/rate-limit';

// Cloudflare Turnstile verification endpoint
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

/**
 * Get client IP from request headers
 */
async function getIpFromHeaders(): Promise<string> {
  const headersList = await headers();
  
  // Try various headers used by proxies/CDNs
  const ipHeaders = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',             // Nginx
    'x-forwarded-for',       // Standard proxy header
    'x-client-ip',           // Some proxies
    'true-client-ip',        // Akamai
  ];

  for (const header of ipHeaders) {
    const value = headersList.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      const ip = value.split(',')[0]?.trim();
      if (ip) {
        return ip;
      }
    }
  }

  return '0.0.0.0';
}

/**
 * Verify Cloudflare Turnstile CAPTCHA token
 */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // If no secret key configured, skip verification (dev mode)
  // In production, you MUST configure TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('[Auth] Turnstile secret key not configured - CAPTCHA verification skipped');
    // In development, allow without CAPTCHA
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // In production, fail if not configured (safer)
    return false;
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      console.warn('[Auth] Turnstile verification failed:', result['error-codes']);
    }
    
    return result.success === true;
  } catch (error) {
    console.error('[Auth] Turnstile verification error:', error);
    return false;
  }
}

/**
 * Log auth event for monitoring
 */
function logAuthEvent(
  action: string,
  email: string,
  ip: string,
  success: boolean,
  details?: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    email: email ? `${email.substring(0, 3)}***@***` : 'unknown', // Partial email for privacy
    ip: ip.substring(0, ip.lastIndexOf('.')) + '.xxx', // Partial IP for privacy
    success,
    ...details,
  };
  
  // In production, this should go to a proper logging service
  // For now, we log to console in a structured format
  console.log('[Auth Event]', JSON.stringify(logEntry));
}

/**
 * Sign up a new user with validation and rate limiting
 */
export async function signUpAction(
  email: string,
  password: string,
  turnstileToken: string
): Promise<AuthActionResult> {
  const ip = await getIpFromHeaders();
  const normalizedEmail = normalizeEmail(email);
  
  // 1. Validate email format and check for disposable domains
  const emailValidation = validateEmail(normalizedEmail, { blockDisposable: true });
  if (!emailValidation.isValid) {
    logAuthEvent('signup', normalizedEmail, ip, false, { reason: 'invalid_email' });
    return {
      success: false,
      error: emailValidation.error,
    };
  }

  // 2. Check rate limits
  const rateLimit = checkAuthRateLimit(ip, normalizedEmail, 'signup');
  if (!rateLimit.allowed) {
    logAuthEvent('signup', normalizedEmail, ip, false, { reason: 'rate_limited' });
    return {
      success: false,
      error: formatRateLimitError(rateLimit),
      rateLimited: true,
      retryAfter: rateLimit.retryAfterSeconds,
    };
  }

  // 3. Verify CAPTCHA
  const captchaValid = await verifyTurnstile(turnstileToken, ip);
  if (!captchaValid) {
    logAuthEvent('signup', normalizedEmail, ip, false, { reason: 'captcha_failed' });
    return {
      success: false,
      error: 'CAPTCHA verification failed. Please try again.',
    };
  }

  // 4. Validate password
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters',
    };
  }

  // 5. Attempt signup with Supabase
  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    if (error) {
      logAuthEvent('signup', normalizedEmail, ip, false, { reason: 'supabase_error', message: error.message });
      
      // Don't reveal if email already exists (prevents enumeration)
      if (error.message.toLowerCase().includes('already registered') || 
          error.message.toLowerCase().includes('already exists')) {
        return {
          success: true, // Return success to prevent enumeration
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }

    logAuthEvent('signup', normalizedEmail, ip, true);
    return { success: true };
  } catch (error) {
    logAuthEvent('signup', normalizedEmail, ip, false, { reason: 'unexpected_error' });
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Request password reset with validation and rate limiting
 */
export async function forgotPasswordAction(
  email: string,
  turnstileToken: string
): Promise<AuthActionResult> {
  const ip = await getIpFromHeaders();
  const normalizedEmail = normalizeEmail(email);
  
  // 1. Validate email format (don't block disposable for password reset)
  const emailValidation = validateEmail(normalizedEmail, { blockDisposable: false });
  if (!emailValidation.isValid) {
    logAuthEvent('forgot_password', normalizedEmail, ip, false, { reason: 'invalid_email' });
    return {
      success: false,
      error: emailValidation.error,
    };
  }

  // 2. Check rate limits
  const rateLimit = checkAuthRateLimit(ip, normalizedEmail, 'reset');
  if (!rateLimit.allowed) {
    logAuthEvent('forgot_password', normalizedEmail, ip, false, { reason: 'rate_limited' });
    return {
      success: false,
      error: formatRateLimitError(rateLimit),
      rateLimited: true,
      retryAfter: rateLimit.retryAfterSeconds,
    };
  }

  // 3. Verify CAPTCHA
  const captchaValid = await verifyTurnstile(turnstileToken, ip);
  if (!captchaValid) {
    logAuthEvent('forgot_password', normalizedEmail, ip, false, { reason: 'captcha_failed' });
    return {
      success: false,
      error: 'CAPTCHA verification failed. Please try again.',
    };
  }

  // 4. Request password reset
  // Always return success to prevent email enumeration
  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });

    logAuthEvent('forgot_password', normalizedEmail, ip, true);
  } catch (error) {
    // Log but don't return error to user (prevents enumeration)
    logAuthEvent('forgot_password', normalizedEmail, ip, false, { reason: 'unexpected_error' });
  }

  // Always return success to prevent enumeration
  return { success: true };
}

/**
 * Resend confirmation email with validation and rate limiting
 */
export async function resendConfirmationAction(
  email: string,
  turnstileToken: string
): Promise<AuthActionResult> {
  const ip = await getIpFromHeaders();
  const normalizedEmail = normalizeEmail(email);
  
  // 1. Validate email format
  const emailValidation = validateEmail(normalizedEmail, { blockDisposable: false });
  if (!emailValidation.isValid) {
    logAuthEvent('resend_confirmation', normalizedEmail, ip, false, { reason: 'invalid_email' });
    return {
      success: false,
      error: emailValidation.error,
    };
  }

  // 2. Check rate limits (strict for resend)
  const rateLimit = checkAuthRateLimit(ip, normalizedEmail, 'resend');
  if (!rateLimit.allowed) {
    logAuthEvent('resend_confirmation', normalizedEmail, ip, false, { reason: 'rate_limited' });
    return {
      success: false,
      error: formatRateLimitError(rateLimit),
      rateLimited: true,
      retryAfter: rateLimit.retryAfterSeconds,
    };
  }

  // 3. Verify CAPTCHA
  const captchaValid = await verifyTurnstile(turnstileToken, ip);
  if (!captchaValid) {
    logAuthEvent('resend_confirmation', normalizedEmail, ip, false, { reason: 'captcha_failed' });
    return {
      success: false,
      error: 'CAPTCHA verification failed. Please try again.',
    };
  }

  // 4. Resend confirmation
  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    if (error) {
      logAuthEvent('resend_confirmation', normalizedEmail, ip, false, { reason: 'supabase_error' });
      return {
        success: false,
        error: 'Failed to resend confirmation email. Please try again.',
      };
    }

    logAuthEvent('resend_confirmation', normalizedEmail, ip, true);
    return { success: true };
  } catch (error) {
    logAuthEvent('resend_confirmation', normalizedEmail, ip, false, { reason: 'unexpected_error' });
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

# Security Incident Report: High Email Bounce Rate

**Date:** February 17, 2026  
**Severity:** Medium  
**Status:** Mitigated  
**Project:** aqthmlhpmhtewhjkhsbn (Interview Replay App)

## Summary

Supabase issued a warning about high email bounce rates from transactional emails. Investigation revealed that auth endpoints lacked rate limiting, CAPTCHA protection, and email validation, making them vulnerable to abuse.

## Root Cause Analysis

### Findings

| Vulnerability | Status Before | Impact |
|--------------|---------------|--------|
| Rate limiting | None | Unlimited requests to email-triggering endpoints |
| CAPTCHA/bot protection | None | Bots could automate form submissions |
| Email validation | HTML5 only | Fake/disposable emails accepted |
| Cooldown on resend | None | Unlimited resend requests |
| Middleware | None | No server-side protection |

### Email-Triggering Endpoints Identified

1. **Sign Up** (`/auth/signup`) → `supabase.auth.signUp()` - sends confirmation email
2. **Forgot Password** (`/auth/forgot-password`) → `supabase.auth.resetPasswordForEmail()` - sends reset email
3. **Resend Confirmation** (`/auth/verify`) → `supabase.auth.resend()` - resends confirmation email

### Probable Attack Vector

An attacker or bot was spamming auth endpoints with:
- Fake email addresses at non-existent domains (causing hard bounces)
- Disposable email domains that may block/bounce Supabase emails
- High-volume requests exploiting the lack of rate limiting

## Mitigations Implemented

### 1. Rate Limiting (`lib/rate-limit.ts`)

In-memory rate limiting with configurable limits:

| Operation | Per IP | Per Email | Window |
|-----------|--------|-----------|--------|
| Signup | 5 requests | 3 requests | 1 hour / 5 min |
| Password Reset | 10 requests | 3 requests | 1 min / 15 min |
| Resend Confirmation | 10 requests | 2 requests | 1 min / 10 min |

### 2. Email Validation (`lib/validation/email.ts`)

- RFC-compliant email format validation
- Disposable email domain blocking (100+ domains)
- Invalid TLD detection (`.test`, `.invalid`, `.localhost`, etc.)
- Client-side and server-side validation

### 3. CAPTCHA Protection (`components/auth/Turnstile.tsx`)

- Cloudflare Turnstile integration on all email-triggering forms
- Server-side token verification in auth actions
- Graceful degradation in development mode

### 4. Server-Side Auth Actions (`app/actions/auth.ts`)

All auth operations now go through protected server actions with:
- Rate limit checks (IP + email)
- CAPTCHA verification
- Email validation
- Structured logging for monitoring
- Account enumeration prevention

### 5. Middleware (`middleware.ts`)

Edge-level protection:
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Auth token refresh
- Request logging for auth paths
- Protected route enforcement

### 6. Monitoring & Logging

Structured logging added to all auth events with:
- Timestamp
- Action type (signup, forgot_password, resend_confirmation)
- Masked email and IP (for privacy)
- Success/failure status
- Failure reason codes

## Files Changed

| File | Change |
|------|--------|
| `lib/validation/email.ts` | **NEW** - Email validation utilities |
| `lib/rate-limit.ts` | **NEW** - Rate limiting utilities |
| `app/actions/auth.ts` | **NEW** - Protected server actions |
| `components/auth/Turnstile.tsx` | **NEW** - CAPTCHA component |
| `components/auth/SignUpForm.tsx` | Updated to use server actions + CAPTCHA |
| `components/auth/ForgotPasswordForm.tsx` | Updated to use server actions + CAPTCHA |
| `components/auth/VerifyEmailForm.tsx` | Updated to use server actions + CAPTCHA |
| `middleware.ts` | **NEW** - Edge middleware |

## Required Configuration

Add these environment variables:

```bash
# Cloudflare Turnstile (get from https://dash.cloudflare.com/turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# For testing locally, use Cloudflare's test keys:
# Site Key (always passes): 1x00000000000000000000AA
# Secret Key (always passes): 1x0000000000000000000000000000000AA
```

## Supabase Configuration Checklist

Verify these settings in the Supabase Dashboard:

1. **Authentication > Settings > Email Auth**
   - [ ] "Confirm email" is enabled
   - [ ] "Secure email change" is enabled
   - [ ] Rate limits are configured (if available)

2. **Authentication > URL Configuration**
   - [ ] Site URL matches `NEXT_PUBLIC_SITE_URL`
   - [ ] Redirect URLs include your auth callback URLs

3. **Authentication > Email Templates**
   - [ ] Templates are customized (reduces spam filter triggers)

## Prevention Plan

### Immediate (Completed)
- [x] Rate limiting on auth endpoints
- [x] CAPTCHA on email-triggering forms
- [x] Email validation (format + disposable blocking)
- [x] Structured logging for monitoring

### Short-term (Recommended)
- [ ] Set up log aggregation (Vercel Logs, Datadog, etc.)
- [ ] Create alerts for unusual auth activity patterns
- [ ] Review Supabase Auth logs weekly

### Long-term (Recommended)
- [ ] Consider moving to Redis-based rate limiting for multi-server deployments
- [ ] Implement IP reputation checking (Cloudflare, MaxMind)
- [ ] Add honeypot fields to forms for additional bot detection
- [ ] Regular security audits of auth flows

## Verification

To confirm Supabase email sending is restored:
1. Deploy the updated code
2. Monitor Supabase dashboard for bounce rate improvement
3. Test sign-up flow with a real email
4. Check logs for proper rate limiting and CAPTCHA verification

## Contact

If you have questions about this incident or the mitigations, please review the code changes or contact the development team.

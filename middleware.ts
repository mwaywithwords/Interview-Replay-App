import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware for authentication and basic abuse protection
 * 
 * This middleware:
 * 1. Refreshes Supabase auth tokens
 * 2. Adds security headers
 * 3. Logs auth-related requests for monitoring
 */

// Paths that trigger email sends and need extra monitoring
const EMAIL_TRIGGER_PATHS = [
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify',
];

// Paths that should be protected (require authentication)
const PROTECTED_PATHS = [
  '/dashboard',
  '/sessions',
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Create Supabase client for token refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session - important for server components
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Log auth-related requests for monitoring
  if (EMAIL_TRIGGER_PATHS.some(path => pathname.startsWith(path))) {
    const ip = getClientIp(request);
    console.log('[Auth Middleware]', {
      timestamp: new Date().toISOString(),
      path: pathname,
      ip: maskIp(ip),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });
  }

  // Redirect unauthenticated users from protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (!user) {
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect unverified users to verify page
    if (!user.email_confirmed_at && pathname !== '/auth/verify') {
      return NextResponse.redirect(new URL('/auth/verify', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) {
    if (user && user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  const headers = [
    'cf-connecting-ip',
    'x-real-ip',
    'x-forwarded-for',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(',')[0]?.trim() || '0.0.0.0';
    }
  }

  return '0.0.0.0';
}

/**
 * Mask IP for privacy in logs
 */
function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'xxx';
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

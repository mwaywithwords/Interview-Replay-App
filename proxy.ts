import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy with Supabase auth and security features
 * 
 * This proxy:
 * 1. Refreshes Supabase auth tokens
 * 2. Adds security headers
 * 3. Logs auth-related requests for monitoring
 * 4. Protects routes and enforces email verification
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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Add security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const pathname = request.nextUrl.pathname;

  // Log auth-related requests for monitoring
  if (EMAIL_TRIGGER_PATHS.some(path => pathname.startsWith(path))) {
    const ip = getClientIp(request);
    console.log('[Auth Proxy]', {
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

  return supabaseResponse;
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

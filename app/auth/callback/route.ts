import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function getSafeNextPath(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

function isLocalCallbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  // If "next" is in param, use it as the redirect URL
  const next = getSafeNextPath(searchParams.get('next'));

  // Determine the correct redirect URL base
  // Priority: NEXT_PUBLIC_SITE_URL > x-forwarded-host > request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const isLocalhost = isLocalCallbackHost(requestUrl.hostname);
  const shouldDebugAuth = isLocalhost || isLocalEnv;
  
  let redirectBase: string;
  if (isLocalhost) {
    // Local OAuth callbacks must finish on the same localhost origin/port
    // that initiated sign-in, including localhost:3000 and localhost:3001.
    redirectBase = origin;
  } else if (siteUrl && !isLocalEnv) {
    // Use configured site URL in production
    redirectBase = siteUrl.replace(/\/$/, ''); // Remove trailing slash if present
  } else if (!isLocalEnv && forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  } else {
    redirectBase = origin;
  }

  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  function normalizeCookieOptions(options: CookieOptions): CookieOptions {
    if (!isLocalhost) return options;

    // Local OAuth runs over http://localhost on ports like 3000/3001. Keep
    // cookies host-only and non-secure so browsers accept them on local HTTP.
    const rest = { ...options };
    delete rest.domain;
    delete rest.secure;
    return {
      ...rest,
      path: rest.path || '/',
      sameSite: rest.sameSite || 'lax',
      secure: false,
    };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookiesToSet) {
          nextCookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...normalizeCookieOptions(options),
            });
          });
          cookiesToSet.push(
            ...nextCookiesToSet.map(({ name, value, options }) => ({
              name,
              value,
              options: normalizeCookieOptions(options),
            }))
          );

          if (shouldDebugAuth) {
            console.info('[Auth Callback] Supabase requested cookie update', {
              cookieNames: nextCookiesToSet.map(({ name }) => name),
              cookieCount: nextCookiesToSet.length,
              localhost: isLocalhost,
            });
          }
        },
      },
    }
  );

  function redirectWithSessionCookies(url: string) {
    const response = NextResponse.redirect(url);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    if (shouldDebugAuth) {
      console.info('[Auth Callback] Redirecting after auth callback', {
        destination: url,
        cookieNames: cookiesToSet.map(({ name }) => name),
        cookieCount: cookiesToSet.length,
      });
    }

    return response;
  }

  if (shouldDebugAuth) {
    console.info('[Auth Callback] Received auth callback', {
      hasCode: Boolean(code),
      hasTokenHash: Boolean(token_hash),
      hasOAuthError: Boolean(oauthError),
      origin,
      next,
      redirectBase,
      localhost: isLocalhost,
    });
  }

  // Handle provider-side OAuth failures, such as a user cancelling consent or
  // a provider/client configuration issue.
  if (oauthError) {
    const friendlyMessage =
      oauthErrorDescription ||
      'Social sign-in could not be completed. Please try again.';

    return redirectWithSessionCookies(
      `${redirectBase}/auth/signin?oauth_error=${encodeURIComponent(friendlyMessage)}`
    );
  }

  // Handle PKCE flow (code-based)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (shouldDebugAuth) {
      console.info('[Auth Callback] exchangeCodeForSession result', {
        hasSession: Boolean(data.session),
        hasUser: Boolean(data.user),
        errorMessage: error?.message,
      });
    }

    if (!error) {
      // For signup/email confirmation, redirect to signin with success message
      if (type === 'signup' || type === 'email') {
        return redirectWithSessionCookies(`${redirectBase}/auth/signin?confirmed=1`);
      }
      return redirectWithSessionCookies(`${redirectBase}${next}`);
    }
    
    console.error('Error exchanging code for session:', error);
    return redirectWithSessionCookies(
      `${redirectBase}/auth/signin?oauth_error=${encodeURIComponent(`Social sign-in could not be completed: ${error.message}`)}`
    );
  }

  // Handle token_hash flow (older email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
    });

    if (!error) {
      // For signup/email confirmation, redirect to signin with success message
      if (type === 'signup' || type === 'email') {
        return redirectWithSessionCookies(`${redirectBase}/auth/signin?confirmed=1`);
      }
      return redirectWithSessionCookies(`${redirectBase}${next}`);
    }
    
    console.error('Error verifying OTP:', error);
    // Redirect to signin with error for confirmation failures
    return redirectWithSessionCookies(
      `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent(error.message)}`
    );
  }

  // Return the user to signin with error message
  return redirectWithSessionCookies(
    `${redirectBase}/auth/signin?oauth_error=${encodeURIComponent('Invalid authentication link. Please try again.')}`
  );
}

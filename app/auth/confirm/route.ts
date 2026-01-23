import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  
  // Get all possible token parameters from Supabase email confirmation
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Determine the correct redirect URL base
  // Priority: NEXT_PUBLIC_SITE_URL > x-forwarded-host > request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  let redirectBase: string;
  if (siteUrl && !isLocalEnv) {
    // Use configured site URL in production
    redirectBase = siteUrl.replace(/\/$/, ''); // Remove trailing slash if present
  } else if (!isLocalEnv && forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  } else {
    redirectBase = origin;
  }

  const supabase = await createClient();

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      // For signup confirmation failures, redirect to signin with error
      return NextResponse.redirect(
        `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent(error.message)}`
      );
    }

    // For signup type, redirect to signin with success message
    // For other types (recovery, etc.), redirect to the intended destination
    if (type === 'signup' || type === 'email') {
      return NextResponse.redirect(`${redirectBase}/auth/signin?confirmed=1`);
    }
    
    // Success - redirect to dashboard or next URL for other flows
    return NextResponse.redirect(`${redirectBase}${next}`);
  }

  // Handle token_hash flow (older email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      // Redirect to signin with error for confirmation failures
      return NextResponse.redirect(
        `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent(error.message)}`
      );
    }

    // For signup confirmation, redirect to signin with success message
    if (type === 'signup' || type === 'email') {
      return NextResponse.redirect(`${redirectBase}/auth/signin?confirmed=1`);
    }
    
    // Success - redirect to dashboard or next URL for other flows
    return NextResponse.redirect(`${redirectBase}${next}`);
  }

  // No valid parameters found - redirect to signin with error
  return NextResponse.redirect(
    `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent('Invalid confirmation link. Please request a new one.')}`
  );
}

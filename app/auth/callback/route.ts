import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  // If "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  // Determine the correct redirect URL base
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  let redirectBase = origin;
  if (!isLocalEnv && forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  }

  const supabase = await createClient();

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // For signup/email confirmation, redirect to signin with success message
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${redirectBase}/auth/signin?confirmed=1`);
      }
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    
    console.error('Error exchanging code for session:', error);
    // Redirect to signin with error for confirmation failures
    return NextResponse.redirect(
      `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent(error.message)}`
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
        return NextResponse.redirect(`${redirectBase}/auth/signin?confirmed=1`);
      }
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    
    console.error('Error verifying OTP:', error);
    // Redirect to signin with error for confirmation failures
    return NextResponse.redirect(
      `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent(error.message)}`
    );
  }

  // Return the user to signin with error message
  return NextResponse.redirect(
    `${redirectBase}/auth/signin?confirmed=0&error=${encodeURIComponent('Invalid authentication link. Please try again.')}`
  );
}

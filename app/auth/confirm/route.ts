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
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${redirectBase}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`
      );
    }

    // Success - redirect to dashboard or next URL
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
      return NextResponse.redirect(
        `${redirectBase}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`
      );
    }

    // Success - redirect to dashboard or next URL
    return NextResponse.redirect(`${redirectBase}${next}`);
  }

  // No valid parameters found
  return NextResponse.redirect(
    `${redirectBase}/auth/auth-code-error?error=${encodeURIComponent('Invalid confirmation link. Please try signing up again.')}`
  );
}

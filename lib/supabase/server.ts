import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Requires an authenticated user. Redirects to sign in if not authenticated.
 * Redirects to verify page if email is not confirmed.
 * Use this in Server Components or Server Actions to protect routes.
 *
 * @returns The authenticated user with confirmed email
 * @throws Redirects to /auth/signin if not authenticated
 * @throws Redirects to /auth/verify if email not confirmed
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/signin');
  }

  // Check if email is confirmed
  if (!user.email_confirmed_at) {
    redirect('/auth/verify');
  }

  return user;
}

/**
 * Gets the current user without requiring email confirmation.
 * Useful for the verify email page where we need user info.
 *
 * @returns The authenticated user or null
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

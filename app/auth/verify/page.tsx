import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { AppShell } from '@/components/layout/AppShell';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
};

export default async function VerifyEmailPage() {
  const user = await getUser();

  // If no user, redirect to sign in
  if (!user) {
    redirect('/auth/signin');
  }

  // If email is already confirmed, redirect to dashboard
  if (user.email_confirmed_at) {
    redirect('/dashboard');
  }

  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <VerifyEmailForm email={user.email || ''} />
      </div>
    </AppShell>
  );
}

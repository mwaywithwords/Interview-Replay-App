import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <AppShell showNav={false}>
      <AuthShell
        eyebrow="New password"
        title="Choose a stronger key"
        description="Update your password without changing the existing recovery flow."
      >
        <ResetPasswordForm />
      </AuthShell>
    </AppShell>
  );
}

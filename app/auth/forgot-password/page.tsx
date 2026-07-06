import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

export default function ForgotPasswordPage() {
  return (
    <AppShell showNav={false}>
      <AuthShell
        eyebrow="Account recovery"
        title="Reset access securely"
        description="Enter your email and we will send the same secure reset link to your inbox."
      >
        <ForgotPasswordForm />
      </AuthShell>
    </AppShell>
  );
}

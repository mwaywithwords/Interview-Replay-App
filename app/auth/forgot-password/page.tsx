import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

export default function ForgotPasswordPage() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <ForgotPasswordForm />
      </div>
    </AppShell>
  );
}

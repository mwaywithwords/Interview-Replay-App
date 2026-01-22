import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <ResetPasswordForm />
      </div>
    </AppShell>
  );
}

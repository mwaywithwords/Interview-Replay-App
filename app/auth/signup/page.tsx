import { SignUpForm } from '@/components/auth/SignUpForm';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <SignUpForm />
      </div>
    </AppShell>
  );
}

import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return (
    <AppShell showNav={false}>
      <AuthShell
        eyebrow="Create account"
        title="Create your prep workspace"
        description="Start preparing for real interviews with fit analysis, tailored materials, and answer feedback."
      >
        <SignUpForm />
      </AuthShell>
    </AppShell>
  );
}

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
        title="Start practicing with intent"
        description="Create your workspace for private recordings, replay notes, and interview improvement."
      >
        <SignUpForm />
      </AuthShell>
    </AppShell>
  );
}

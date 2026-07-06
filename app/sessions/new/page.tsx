import { AppShell } from '@/components/layout/AppShell';
import { NewSessionForm } from '@/components/sessions/NewSessionForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quick Practice',
};

export default function NewSessionPage() {
  return (
    <AppShell variant="app">
      <NewSessionForm />
    </AppShell>
  );
}

import { AppShell } from '@/components/layout/AppShell';
import { NewJobPrepForm } from '@/components/job-prep/NewJobPrepForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Job Prep',
};

export default function NewJobPrepPage() {
  return (
    <AppShell variant="app">
      <NewJobPrepForm />
    </AppShell>
  );
}

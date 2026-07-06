import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { Badge } from '@/components/ui/badge';
import { branding } from '@/lib/branding';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${branding.brandName}.`,
};

const lastUpdated = 'July 5, 2026';

const sections = [
  {
    title: 'Introduction',
    content: [
      `${branding.brandName} helps users record, replay, annotate, and review practice sessions. This Privacy Policy explains what information we collect, how we use it, and the choices you have when using the service.`,
      'By using the application, you agree to the collection and use of information as described in this policy.',
    ],
  },
  {
    title: 'Information We Collect',
    content: [
      'Account information, such as your email address, authentication provider profile information, and basic account identifiers.',
      'Session content that you create, including recordings, transcripts, notes, bookmarks, session titles, prompts, and analysis outputs.',
      'Technical information, such as browser type, device information, IP address, timestamps, and application logs needed to secure and operate the service.',
    ],
  },
  {
    title: 'How We Use Information',
    content: [
      'To provide core product features, including authentication, session recording, playback, bookmarks, notes, transcripts, and AI-assisted review.',
      'To maintain account security, prevent abuse, troubleshoot issues, improve reliability, and communicate important service updates.',
      'To improve the user experience and understand how users interact with the product in aggregate.',
    ],
  },
  {
    title: 'Authentication Providers',
    content: [
      `${branding.brandName} supports sign-in with Google, LinkedIn, and GitHub through Supabase Auth. When you use one of these providers, we may receive basic profile details such as your name, email address, provider user ID, and avatar if provided by that service.`,
      'We use this information only to create and secure your account and to keep your signed-in session working.',
    ],
  },
  {
    title: 'Cookies and Analytics',
    content: [
      'We use cookies and similar technologies that are necessary for authentication, session management, security, and product functionality.',
      'We may use privacy-conscious analytics or application telemetry to understand product usage, diagnose performance issues, and improve the service. You can control cookies through your browser settings, but disabling necessary cookies may prevent the app from working correctly.',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'We rely on trusted third-party services to operate the application, including Supabase for authentication, database, and storage infrastructure; OAuth providers for social sign-in; and infrastructure or security services used to deliver and protect the app.',
      'These providers process information according to their own privacy and security terms. We do not sell your personal information.',
    ],
  },
  {
    title: 'Data Retention',
    content: [
      'We retain account information and user-created session data for as long as your account is active or as needed to provide the service.',
      'You may delete content from the app where deletion controls are available. Some information may remain in backups, logs, or records for a limited period where required for security, legal, or operational reasons.',
    ],
  },
  {
    title: 'User Rights',
    content: [
      'Depending on your location, you may have rights to access, correct, export, delete, or restrict the processing of your personal information.',
      'You can manage much of your account and session content directly in the application. For additional requests, contact us using the information below.',
    ],
  },
  {
    title: 'Contact Information',
    content: [
      'For privacy questions, data requests, or security concerns, contact the ReplayAI team at privacy@replayai.app.',
      'If this contact address changes, we will update this Privacy Policy with the latest information.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <AppShell
      headerActions={
        <Link
          href="/auth/signin"
          className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/25 hover:text-foreground"
        >
          Sign In
        </Link>
      }
    >
      <div className="relative overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-[-240px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-primary/14 blur-3xl" />
          <div className="absolute right-[-160px] top-[360px] h-[420px] w-[420px] rounded-full bg-info/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.12] [mask-image:radial-gradient(circle_at_top,black,transparent_60%)]" />
        </div>

        <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="info" className="mb-5 gap-2 rounded-full px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy
            </Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              We design {branding.brandName} to keep your practice data private, secure, and under your control.
            </p>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <SectionCard className="rounded-[2rem] border-border/60 bg-card/70 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.title} className="scroll-mt-24">
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

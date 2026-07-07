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

const lastUpdated = 'July 7, 2026';

const sections = [
  {
    title: 'Introduction',
    content: [
      `${branding.brandName} is an AI-powered interview preparation platform. We help you upload résumés and job descriptions, generate tailored application materials, practice interview questions, record your responses, and receive AI-powered feedback.`,
      'This Privacy Policy explains what information we collect, how we use it, how long we keep it, and the choices available to you. By creating an account or using the service, you agree to the practices described here.',
    ],
  },
  {
    title: 'Information We Collect',
    content: [
      'Account and profile information, such as your email address, display name, authentication provider details, and account identifiers.',
      'Application and preparation content, including résumé uploads, job descriptions you upload or paste, tailored résumés, interview questions, practice session metadata, and Job Prep project data.',
      'Recording and review content, including audio and video responses, transcripts, notes, bookmarks, AI analysis outputs, and session titles or labels you provide.',
      'Sharing activity, such as secure share links you create and related access metadata needed to deliver shared session views.',
      'Technical and security information, such as browser type, device information, IP address, timestamps, authentication session data, and application logs used to operate, secure, and troubleshoot the service.',
    ],
  },
  {
    title: 'Authentication Data',
    content: [
      `${branding.brandName} supports sign-in with email and password, as well as social sign-in through Google, GitHub, and LinkedIn via Supabase Auth.`,
      'When you use a social provider, we may receive basic profile information such as your name, email address, provider user ID, and avatar if made available by that provider. We use this information only to create and secure your account and maintain your signed-in session.',
      'We use cookies and similar session technologies that are necessary for authentication, account security, and keeping you signed in. Cloudflare Turnstile may be used during sign-up and sign-in to help protect against automated abuse.',
    ],
  },
  {
    title: 'Résumé and Job Description Data',
    content: [
      'When you upload a résumé or provide a job description, we store that content in your workspace so you can generate tailored résumés, personalized interview questions, and related preparation materials.',
      'Résumé files and extracted text are associated with your account and used to power Job Prep features and AI-assisted analysis. We do not use your résumé content to train public AI models.',
    ],
  },
  {
    title: 'Audio and Video Recordings',
    content: [
      'When you record practice interview responses, we store the audio and/or video files you create, along with related session metadata such as question prompts, timestamps, and playback information.',
      'Recordings are stored in secure cloud storage associated with your account. They are used to provide playback, transcript generation, bookmarks, notes, AI feedback, and optional sharing through secure links you control.',
    ],
  },
  {
    title: 'Transcripts',
    content: [
      'We generate transcripts from your recorded responses to support review, search, annotation, and AI analysis. Transcript text is stored with the corresponding practice session in your account.',
      'Transcripts may be processed by AI services to produce coaching feedback, summaries, or structured review outputs tied to your session.',
    ],
  },
  {
    title: 'AI-Generated Content',
    content: [
      `${branding.brandName} uses AI to generate tailored résumés, interview questions, transcripts, and interview feedback based on content you provide or record.`,
      'AI outputs are stored in your account as part of your Job Prep projects and practice sessions. AI-generated content is provided for preparation purposes only and may not always be accurate or complete. You remain responsible for reviewing outputs before relying on them.',
      'To deliver these features, selected content may be sent to third-party AI providers for processing. We do not sell your personal information or use your content to train public AI models on behalf of third parties beyond what is required to provide the service.',
    ],
  },
  {
    title: 'Notes, Bookmarks, and Shared Sessions',
    content: [
      'Notes and bookmarks you create during session review are stored with your account and associated practice sessions.',
      'If you generate a secure share link for a session, recipients with that link may view the shared session content according to the permissions of that link. You should treat share links as sensitive and share them only with intended recipients.',
    ],
  },
  {
    title: 'How We Use Information',
    content: [
      'To provide core product features, including authentication, résumé and job description processing, AI-generated preparation materials, recording, playback, transcripts, notes, bookmarks, analytics, and session sharing.',
      'To maintain account security, prevent abuse, enforce service limits, troubleshoot issues, improve reliability, and communicate important service updates.',
      'To understand product usage in aggregate and improve the user experience, performance, and functionality of the platform.',
    ],
  },
  {
    title: 'Cookies and Authentication',
    content: [
      'We use cookies and similar technologies that are necessary for authentication, session management, security preferences, and core product functionality.',
      'You can control cookies through your browser settings. Disabling necessary cookies may prevent you from signing in or using parts of the application.',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'We rely on trusted third-party services to operate the application, including:',
      'Supabase for authentication, database, and file storage infrastructure.',
      'Google, GitHub, and LinkedIn for optional OAuth sign-in.',
      'OpenAI for AI-powered features such as résumé tailoring, question generation, transcription, and interview feedback.',
      'Cloudflare Turnstile for bot protection during authentication flows.',
      'Vercel for application hosting and delivery.',
      'These providers process information according to their own privacy and security terms. We do not sell your personal information.',
    ],
  },
  {
    title: 'Data Retention',
    content: [
      'We retain account information and user-created content for as long as your account is active or as needed to provide the service.',
      'If you delete content within the application where deletion controls are available, we remove it from active production systems. Some information may remain in backups, logs, or security records for a limited period where required for security, legal, or operational reasons.',
      'Some account export and deletion controls are not yet available in the product interface. If you need help with a data request before those controls launch, contact us using the information below.',
    ],
  },
  {
    title: 'User Rights',
    content: [
      'Depending on your location, you may have rights to access, correct, export, delete, or restrict the processing of your personal information.',
      'You can manage much of your account information, Job Prep projects, and practice session content directly in the application. For additional privacy requests, contact us at the email address below.',
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
              We design {branding.brandName} to keep your preparation data private, secure, and under your control.
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

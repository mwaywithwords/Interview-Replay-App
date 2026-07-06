'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Bot,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  FileText,
  Gauge,
  Mail,
  Menu,
  Palette,
  PlayCircle,
  Shield,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SettingsSectionId =
  | 'account'
  | 'ai'
  | 'playback'
  | 'transcript'
  | 'notifications'
  | 'appearance'
  | 'privacy'
  | 'subscription';

interface SettingsExperienceProps {
  user: {
    id: string;
    email?: string;
    name: string;
  };
  usage: {
    totalSessions: number;
    storageUsedMb: number;
    aiReadySessions: number;
  };
}

interface NavItem {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ElementType;
}

const navItems: NavItem[] = [
  { id: 'account', label: 'Account', description: 'Identity and access', icon: UserRound },
  { id: 'ai', label: 'AI Preferences', description: 'Analysis defaults', icon: Bot },
  { id: 'playback', label: 'Playback', description: 'Replay behavior', icon: PlayCircle },
  { id: 'transcript', label: 'Transcript', description: 'Review workflow', icon: FileText },
  { id: 'notifications', label: 'Notifications', description: 'Email preferences', icon: Mail },
  { id: 'appearance', label: 'Appearance', description: 'Theme controls', icon: Palette },
  { id: 'privacy', label: 'Privacy', description: 'Export and deletion', icon: Shield },
  { id: 'subscription', label: 'Subscription', description: 'Plan and usage', icon: CreditCard },
];

function ComingSoonBadge() {
  return (
    <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] uppercase tracking-wider">
      Coming soon
    </Badge>
  );
}

function SettingsCard({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className="min-w-0 scroll-mt-28 rounded-[1.5rem] border border-border/45 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur sm:rounded-[1.75rem]"
    >
      <div className="border-b border-border/35 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border/35">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
  comingSoon = false,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {comingSoon && <ComingSoonBadge />}
        </div>
        <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children && <div className="w-full shrink-0 sm:w-auto sm:min-w-[12rem] [&>*]:w-full">{children}</div>}
    </div>
  );
}

function ToggleControl({
  checked,
  disabled = true,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 w-16 items-center rounded-full border p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked
          ? 'border-primary/25 bg-primary/80'
          : 'border-border/70 bg-muted/70',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span
        className={cn(
          'h-9 w-9 rounded-full bg-background shadow-sm transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

function SegmentedControl({
  value,
  options,
  disabled = true,
  label,
}: {
  value: string;
  options: string[];
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex min-h-11 w-full flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 sm:inline-flex sm:w-auto sm:flex-nowrap"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          disabled={disabled}
          className={cn(
            'min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
            value === option
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'cursor-not-allowed opacity-70'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const options = ['light', 'dark', 'system'] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex min-h-11 w-full gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 sm:inline-flex sm:w-auto"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={(theme || 'system') === option}
          onClick={() => setTheme(option)}
          className={cn(
            'min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
            (theme || 'system') === option
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function DisabledSelect({ value, label }: { value: string; label: string }) {
  return (
    <Select value={value} disabled>
      <SelectTrigger aria-label={label} className="bg-background/60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={value}>{value}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function UsageMeter({
  label,
  value,
  helper,
  percent,
}: {
  label: string;
  value: string;
  helper: string;
  percent: number;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{helper}</p>
        </div>
        <span className="text-lg font-semibold tabular-nums tracking-[-0.04em] text-foreground">
          {value}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-info to-success"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function SettingsExperience({ user, usage }: SettingsExperienceProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('account');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id as SettingsSectionId);
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const displayEmail = user.email || 'No email available';
  const activeItem = navItems.find((item) => item.id === activeSection) ?? navItems[0];
  const ActiveIcon = activeItem.icon;
  const storagePercent = useMemo(
    () => Math.min(100, Math.round((usage.storageUsedMb / 500) * 100)),
    [usage.storageUsedMb]
  );

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[5.5rem_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] 2xl:gap-8">
      <div className="sticky top-20 z-30 md:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={mobileMenuOpen}
          aria-controls="settings-mobile-menu"
          onClick={() => setMobileMenuOpen(true)}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-border/50 bg-background/90 px-4 py-3 text-left shadow-[var(--shadow-soft)] backdrop-blur-xl transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ActiveIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Settings
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">
                {activeItem.label}
              </span>
            </span>
          </span>
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <aside className="hidden md:sticky md:top-24 md:block md:self-start">
        <div className="rounded-[1.5rem] border border-border/45 bg-card/65 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="hidden px-3 py-3 xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Settings
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Tune Replay for your workflow.
            </p>
          </div>
          <nav aria-label="Settings sections" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'group flex min-h-12 items-center justify-center gap-3 rounded-2xl px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:justify-start',
                    active
                      ? 'bg-primary/10 text-foreground ring-1 ring-primary/15'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                      active
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border/45 bg-background/50 text-muted-foreground group-hover:text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="hidden min-w-0 xl:block">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs font-medium opacity-75">
                      {item.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[80] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-mobile-menu-title"
          id="settings-mobile-menu"
        >
          <button
            type="button"
            aria-label="Close settings menu"
            className="absolute inset-0 bg-background/65 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[2rem] border border-border/50 bg-card p-4 shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 id="settings-mobile-menu-title" className="text-lg font-semibold tracking-[-0.04em] text-foreground">
                  Settings menu
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Jump to a section
                </p>
              </div>
              <button
                type="button"
                aria-label="Close settings menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile settings sections" className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-primary/20 bg-primary/10 text-foreground'
                        : 'border-border/40 bg-background/45 text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-card/70 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs font-medium opacity-75">
                        {item.description}
                      </span>
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="min-w-0 space-y-5">
        <SettingsCard
          id="account"
          title="Account"
          description="Manage your identity and access settings."
          icon={UserRound}
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Name
              </Label>
              <Input id="settings-name" value={user.name} readOnly className="bg-background/60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Email
              </Label>
              <Input id="settings-email" value={displayEmail} readOnly className="bg-background/60" />
            </div>
          </div>
          <SettingRow
            title="Password"
            description="Use the existing secure password recovery flow to update your password."
          >
            <Link href="/auth/forgot-password">
              <SecondaryButton variant="outline" className="w-full rounded-full">
                Change Password
              </SecondaryButton>
            </Link>
          </SettingRow>
          <SettingRow
            title="Delete account"
            description="Permanent account deletion is not available in-product yet."
            comingSoon
          >
            <Button disabled variant="destructive" className="w-full rounded-full">
              Delete Account
            </Button>
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="ai"
          title="AI Preferences"
          description="Configure how Replay should analyze new sessions."
          icon={Bot}
        >
          <SettingRow
            title="Default AI Analysis"
            description="Choose how much depth Replay should use when analysis defaults are supported."
            comingSoon
          >
            <SegmentedControl
              value="Standard"
              options={['Quick', 'Standard', 'Deep']}
              label="Default AI Analysis"
            />
          </SettingRow>
          <SettingRow
            title="Auto-run AI after upload"
            description="Automatically start the AI pipeline after a recording upload completes."
            comingSoon
          >
            <ToggleControl checked label="Auto-run AI after upload" />
          </SettingRow>
          <SettingRow
            title="Preferred AI model"
            description="Model selection will appear here when multiple analysis models are supported."
            comingSoon
          >
            <DisabledSelect value="Replay default" label="Preferred AI model" />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="playback"
          title="Playback"
          description="Set your preferred replay behavior for interviews."
          icon={Gauge}
        >
          <SettingRow
            title="Default playback speed"
            description="Start audio and video reviews at your preferred speed."
            comingSoon
          >
            <SegmentedControl
              value="1x"
              options={['0.75x', '1x', '1.25x', '1.5x']}
              label="Default playback speed"
            />
          </SettingRow>
          <SettingRow
            title="Remember playback position"
            description="Return to the last reviewed moment when reopening a session."
            comingSoon
          >
            <ToggleControl checked label="Remember playback position" />
          </SettingRow>
          <SettingRow
            title="Auto-scroll transcript"
            description="Keep the transcript aligned with the current playback time."
            comingSoon
          >
            <ToggleControl checked label="Auto-scroll transcript" />
          </SettingRow>
          <SettingRow
            title="Show timestamps"
            description="Display timestamps alongside transcript and bookmark moments."
            comingSoon
          >
            <ToggleControl checked label="Show timestamps" />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="transcript"
          title="Transcript"
          description="Control how transcripts behave while you review."
          icon={FileText}
        >
          <SettingRow
            title="Highlight active sentence"
            description="Emphasize the sentence currently aligned to playback."
            comingSoon
          >
            <ToggleControl checked label="Highlight active sentence" />
          </SettingRow>
          <SettingRow
            title="Speaker labels"
            description="Show speaker labels when transcript diarization is available."
            comingSoon
          >
            <ToggleControl checked label="Speaker labels" />
          </SettingRow>
          <SettingRow
            title="Auto-save transcript edits"
            description="Persist transcript changes automatically while editing."
            comingSoon
          >
            <ToggleControl checked label="Auto-save transcript edits" />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="notifications"
          title="Notifications"
          description="Choose which product updates should reach you."
          icon={Mail}
        >
          <SettingRow
            title="AI analysis complete"
            description="Notify me when Replay finishes analyzing an interview."
            comingSoon
          >
            <ToggleControl checked label="AI analysis complete notifications" />
          </SettingRow>
          <SettingRow
            title="Product updates"
            description="Receive occasional product announcements and improvements."
            comingSoon
          >
            <ToggleControl checked={false} label="Product update notifications" />
          </SettingRow>
          <SettingRow
            title="Weekly summary"
            description="Get a weekly digest of practice sessions, streaks, and progress."
            comingSoon
          >
            <ToggleControl checked label="Weekly summary notifications" />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="appearance"
          title="Appearance"
          description="Match Replay to your environment and preference."
          icon={Palette}
        >
          <SettingRow
            title="Theme"
            description="This setting is available now and syncs through the existing theme provider."
          >
            <ThemeSelector />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          id="privacy"
          title="Privacy"
          description="Export, download, and delete data when these controls are supported."
          icon={Shield}
        >
          {[
            {
              title: 'Export all data',
              description: 'Prepare a full account export containing sessions and review artifacts.',
              icon: Download,
            },
            {
              title: 'Download sessions',
              description: 'Download interview media and associated review data in bulk.',
              icon: Eye,
            },
            {
              title: 'Delete all sessions',
              description: 'Permanently remove every session in your Replay workspace.',
              icon: Trash2,
              danger: true,
            },
            {
              title: 'Delete account',
              description: 'Permanently remove your account and all Replay data.',
              icon: Trash2,
              danger: true,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <SettingRow
                key={item.title}
                title={item.title}
                description={item.description}
                comingSoon
              >
                <Button
                  disabled
                  variant={item.danger ? 'destructive' : 'outline'}
                  className="w-full rounded-full"
                >
                  <Icon className="h-4 w-4" />
                  {item.danger ? 'Unavailable' : 'Prepare'}
                </Button>
              </SettingRow>
            );
          })}
        </SettingsCard>

        <SettingsCard
          id="subscription"
          title="Subscription"
          description="Plan, storage, and AI usage for your Replay account."
          icon={CreditCard}
        >
          <div className="p-5 sm:p-6">
            <div className="rounded-[1.5rem] border border-border/40 bg-gradient-to-br from-primary/10 via-background/55 to-background/35 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge variant="info" className="rounded-full">
                    Coming Soon
                  </Badge>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    Billing is not implemented yet.
                  </h3>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
                    Replay will show plan management, storage limits, and AI usage here when subscriptions launch.
                  </p>
                </div>
                <PrimaryButton disabled className="rounded-full">
                  Upgrade
                  <ChevronRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <UsageMeter
                  label="Current Plan"
                  value="Free"
                  helper="Starter workspace"
                  percent={35}
                />
                <UsageMeter
                  label="Storage Used"
                  value={`${usage.storageUsedMb} MB`}
                  helper={`${usage.totalSessions} session${usage.totalSessions === 1 ? '' : 's'}`}
                  percent={storagePercent}
                />
                <UsageMeter
                  label="AI Usage"
                  value={`${usage.aiReadySessions}`}
                  helper="Ready analyses"
                  percent={Math.min(100, usage.aiReadySessions * 12)}
                />
              </div>
            </div>
          </div>
        </SettingsCard>

        <div className="rounded-[1.5rem] border border-border/35 bg-card/55 p-4 text-sm font-medium text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-3.5 w-3.5" />
            </div>
            <p>
              Settings marked as Coming Soon are intentionally disabled until the backend supports persistence. Existing account, password, and theme controls are wired up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

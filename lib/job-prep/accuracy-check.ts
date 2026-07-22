export type AccuracyCheckStatus = 'success' | 'warning' | 'error' | 'neutral';

export type AccuracyCheckAvailability =
  | 'available'
  | 'not_evaluated'
  | 'unavailable';

export interface AccuracyCheckInput {
  availability?: AccuracyCheckAvailability;
  warnings?: unknown;
  reviewItems?: unknown;
}

export interface AccuracyCheckState {
  status: AccuracyCheckStatus;
  title: string;
  description: string;
  accessibleLabel: string;
}

export const accuracyCheckToneClasses: Record<
  AccuracyCheckStatus,
  { card: string; icon: string }
> = {
  success: {
    card: 'border-success/25 bg-success/[0.04]',
    icon: 'text-success',
  },
  warning: {
    card: 'border-warning/25 bg-warning/[0.05]',
    icon: 'text-warning',
  },
  error: {
    card: 'border-destructive/25 bg-destructive/[0.03]',
    icon: 'text-destructive',
  },
  neutral: {
    card: 'border-border/70 bg-card/65',
    icon: 'text-muted-foreground',
  },
};

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

export function resolveAccuracyCheckState({
  availability = 'available',
  warnings,
  reviewItems,
}: AccuracyCheckInput): AccuracyCheckState {
  if (availability === 'not_evaluated') {
    return {
      status: 'neutral',
      title: 'Accuracy check not yet evaluated',
      description: 'Generate a tailored résumé to run this check.',
      accessibleLabel: 'Accuracy check: not yet evaluated',
    };
  }

  if (
    availability === 'unavailable' ||
    !isStringArray(warnings) ||
    !isStringArray(reviewItems)
  ) {
    return {
      status: 'neutral',
      title: 'Accuracy check unavailable',
      description:
        'We could not complete this check. Review the generated content before using it.',
      accessibleLabel: 'Accuracy check: unavailable',
    };
  }

  if (warnings.length > 0) {
    return {
      status: 'error',
      title: 'Potential unsupported claims detected',
      description:
        'Review or remove these statements before submitting the résumé.',
      accessibleLabel: `Accuracy check: ${warnings.length} potential unsupported ${
        warnings.length === 1 ? 'claim' : 'claims'
      } detected`,
    };
  }

  if (reviewItems.length > 0) {
    return {
      status: 'warning',
      title: 'Review these claims',
      description:
        'Some suggested additions need confirmation before you add them to this résumé.',
      accessibleLabel: `Accuracy check: ${reviewItems.length} ${
        reviewItems.length === 1 ? 'claim needs' : 'claims need'
      } review`,
    };
  }

  return {
    status: 'success',
    title: 'No accuracy concerns detected',
    description:
      'The tailored résumé appears consistent with the information provided.',
    accessibleLabel: 'Accuracy check: no concerns detected',
  };
}

import type { TailoredResumeResult } from '@/types';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseTailoredResumeResult(value: unknown): TailoredResumeResult | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.tailored_resume_text !== 'string' ||
    !record.tailored_resume_text.trim() ||
    !isStringArray(record.change_summary) ||
    !isStringArray(record.truthfulness_warnings) ||
    !isStringArray(record.suggested_additions_user_must_confirm)
  ) {
    return null;
  }

  return {
    tailored_resume_text: record.tailored_resume_text.trim(),
    change_summary: record.change_summary,
    truthfulness_warnings: record.truthfulness_warnings,
    suggested_additions_user_must_confirm: record.suggested_additions_user_must_confirm,
  };
}

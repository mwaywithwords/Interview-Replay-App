import type { ResumeJobAnalysisSummary } from '@/types';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseResumeJobAnalysisSummary(
  value: unknown
): ResumeJobAnalysisSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const score = record.overall_match_score;
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return null;
  }

  if (
    !isStringArray(record.missing_keywords) ||
    !isStringArray(record.matched_skills) ||
    !isStringArray(record.weak_resume_sections) ||
    !isStringArray(record.recommended_resume_changes) ||
    !isStringArray(record.risk_flags) ||
    typeof record.summary !== 'string'
  ) {
    return null;
  }

  return {
    overall_match_score: Math.max(0, Math.min(100, Math.round(score))),
    missing_keywords: record.missing_keywords,
    matched_skills: record.matched_skills,
    weak_resume_sections: record.weak_resume_sections,
    recommended_resume_changes: record.recommended_resume_changes,
    risk_flags: record.risk_flags,
    summary: record.summary,
  };
}

export function getMatchScoreLabel(score: number): string {
  if (score >= 80) return 'Strong fit';
  if (score >= 60) return 'Moderate fit';
  if (score >= 40) return 'Partial fit';
  return 'Needs work';
}

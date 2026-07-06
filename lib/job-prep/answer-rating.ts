import type { InterviewAnswerRatingResult } from '@/types';

const CATEGORY_KEYS = [
  'relevance',
  'structure',
  'clarity',
  'confidence',
  'completeness',
  'job_alignment',
  'examples_evidence',
  'conciseness',
] as const;

export type AnswerRatingCategoryKey = (typeof CATEGORY_KEYS)[number];

export const ANSWER_RATING_CATEGORY_LABELS: Record<AnswerRatingCategoryKey, string> = {
  relevance: 'Relevance',
  structure: 'Structure',
  clarity: 'Clarity',
  confidence: 'Confidence',
  completeness: 'Completeness',
  job_alignment: 'Job alignment',
  examples_evidence: 'Examples & evidence',
  conciseness: 'Conciseness',
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseCategoryScores(value: unknown): InterviewAnswerRatingResult['category_scores'] | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const scores = {} as InterviewAnswerRatingResult['category_scores'];

  for (const key of CATEGORY_KEYS) {
    const score = record[key];
    if (typeof score !== 'number' || Number.isNaN(score)) {
      return null;
    }
    scores[key] = Math.max(0, Math.min(100, Math.round(score)));
  }

  return scores;
}

export function parseInterviewAnswerRatingResult(
  value: unknown
): InterviewAnswerRatingResult | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const overallScore = record.overall_score;

  if (typeof overallScore !== 'number' || Number.isNaN(overallScore)) {
    return null;
  }

  const categoryScores = parseCategoryScores(record.category_scores);
  if (!categoryScores) {
    return null;
  }

  if (
    !isStringArray(record.what_went_well) ||
    !isStringArray(record.what_was_missing) ||
    typeof record.improved_sample_answer !== 'string' ||
    !record.improved_sample_answer.trim() ||
    typeof record.next_practice_tip !== 'string' ||
    !record.next_practice_tip.trim()
  ) {
    return null;
  }

  return {
    overall_score: Math.max(0, Math.min(100, Math.round(overallScore))),
    category_scores: categoryScores,
    what_went_well: record.what_went_well,
    what_was_missing: record.what_was_missing,
    improved_sample_answer: record.improved_sample_answer.trim(),
    next_practice_tip: record.next_practice_tip.trim(),
  };
}

export function getAnswerRatingLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Developing';
  if (score >= 40) return 'Needs work';
  return 'Rework recommended';
}

export function getAnswerRatingCategoryEntries(
  rating: InterviewAnswerRatingResult
): Array<{ key: AnswerRatingCategoryKey; label: string; score: number }> {
  return CATEGORY_KEYS.map((key) => ({
    key,
    label: ANSWER_RATING_CATEGORY_LABELS[key],
    score: rating.category_scores[key],
  }));
}

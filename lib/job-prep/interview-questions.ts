import type { InterviewQuestion, InterviewQuestionType } from '@/types';

export const INTERVIEW_QUESTION_TYPE_COUNTS_MVP: Partial<
  Record<InterviewQuestionType, number>
> = {
  behavioral: 2,
  technical: 2,
  resume_specific: 1,
  why_role_company: 1,
};

export const INTERVIEW_QUESTION_MVP_TYPES = (
  Object.keys(INTERVIEW_QUESTION_TYPE_COUNTS_MVP) as InterviewQuestionType[]
).filter((type) => (INTERVIEW_QUESTION_TYPE_COUNTS_MVP[type] ?? 0) > 0);

export function getInterviewQuestionTargetCount(): number {
  return Object.values(INTERVIEW_QUESTION_TYPE_COUNTS_MVP).reduce(
    (total, count) => total + (count ?? 0),
    0
  );
}

/** Internal MVP default target count. Do not use in user-facing copy. */
export const INTERVIEW_QUESTION_TARGET_COUNT = getInterviewQuestionTargetCount();

export const INTERVIEW_QUESTION_TYPE_ORDER: InterviewQuestionType[] = [
  'behavioral',
  'technical',
  'resume_specific',
  'gap_risk',
  'why_role_company',
];

export const INTERVIEW_QUESTION_TYPE_LABELS: Record<InterviewQuestionType, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  resume_specific: 'Résumé-specific',
  gap_risk: 'Gap & risk',
  why_role_company: 'Company / role fit',
};

export const INTERVIEW_QUESTION_DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const;

export function describeInterviewQuestionGeneration(): string {
  return 'Create a focused set of interview questions from your résumé, job description, and fit analysis.';
}

export function describeInterviewQuestionGenerationProgress(): string {
  return 'ReplayAI is creating personalized interview questions from your résumé and role.';
}

export function describeInterviewQuestionTopics(): string {
  return 'Get role-specific questions based on your résumé and the job.';
}

export function groupInterviewQuestionsByType(
  questions: InterviewQuestion[]
): Record<InterviewQuestionType, InterviewQuestion[]> {
  const grouped = INTERVIEW_QUESTION_TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = [];
      return acc;
    },
    {} as Record<InterviewQuestionType, InterviewQuestion[]>
  );

  for (const question of questions) {
    if (grouped[question.question_type]) {
      grouped[question.question_type].push(question);
    }
  }

  for (const type of INTERVIEW_QUESTION_TYPE_ORDER) {
    grouped[type].sort((a, b) => a.sort_order - b.sort_order);
  }

  return grouped;
}

import type { InterviewQuestion, InterviewQuestionType } from '@/types';

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
  why_role_company: 'Why this role / company',
};

export const INTERVIEW_QUESTION_DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const;

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

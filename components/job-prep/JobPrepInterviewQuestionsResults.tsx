'use client';

import { PracticeAnswerButton } from '@/components/job-prep/PracticeAnswerButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  groupInterviewQuestionsByType,
  INTERVIEW_QUESTION_DIFFICULTY_LABELS,
  INTERVIEW_QUESTION_TYPE_LABELS,
  INTERVIEW_QUESTION_TYPE_ORDER,
} from '@/lib/job-prep/interview-questions';
import type { InterviewQuestion, InterviewQuestionDifficulty } from '@/types';
import { Briefcase, FileText, Lightbulb, MessageCircleQuestion } from 'lucide-react';

function difficultyVariant(
  difficulty: InterviewQuestionDifficulty
): 'secondary' | 'info' | 'warning' {
  switch (difficulty) {
    case 'easy':
      return 'secondary';
    case 'hard':
      return 'warning';
    default:
      return 'info';
  }
}

function QuestionCard({
  question,
  index,
}: {
  question: InterviewQuestion;
  index: number;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-background/55 shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
              {index}
            </div>
            <p className="text-base font-semibold leading-7 tracking-[-0.02em] text-foreground">
              {question.question_text}
            </p>
          </div>
          <Badge
            variant={difficultyVariant(question.difficulty)}
            className="shrink-0 rounded-full capitalize"
          >
            {INTERVIEW_QUESTION_DIFFICULTY_LABELS[question.difficulty]}
          </Badge>
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              What a strong answer should include
            </p>
          </div>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            {question.what_good_answer_should_include}
          </p>
        </div>

        <div className="flex justify-end">
          <PracticeAnswerButton question={question} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/35 bg-background/45 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                Related résumé section
              </p>
            </div>
            <p className="text-sm font-medium leading-6 text-foreground">
              {question.related_resume_section}
            </p>
          </div>
          <div className="rounded-xl border border-border/35 bg-background/45 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                Related job requirement
              </p>
            </div>
            <p className="text-sm font-medium leading-6 text-foreground">
              {question.related_job_requirement}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface JobPrepInterviewQuestionsResultsProps {
  questions: InterviewQuestion[];
}

export function JobPrepInterviewQuestionsResults({
  questions,
}: JobPrepInterviewQuestionsResultsProps) {
  const grouped = groupInterviewQuestionsByType(questions);

  return (
    <div className="space-y-8">
      {INTERVIEW_QUESTION_TYPE_ORDER.map((type) => {
        const typeQuestions = grouped[type];
        if (typeQuestions.length === 0) {
          return null;
        }

        return (
          <section key={type} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                  {INTERVIEW_QUESTION_TYPE_LABELS[type]}
                </h3>
              </div>
              <Badge variant="outline" className="rounded-full">
                {typeQuestions.length} question{typeQuestions.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <div className="space-y-4">
              {typeQuestions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index + 1} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

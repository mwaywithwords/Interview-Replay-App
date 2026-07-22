import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobPrepDetail } from '@/components/job-prep/JobPrepDetail';
import {
  createInterviewQuestion,
  createInterviewQuestionGeneration,
  createJobPrepProject,
} from '@/components/job-prep/__tests__/job-prep-detail-fixtures';

const runInterviewQuestionGeneration = vi.fn();
const retryInterviewQuestionGeneration = vi.fn();
const getJobPrepProject = vi.fn();
const startInterviewAnswerPractice = vi.fn();
const push = vi.fn();

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/actions/job-prep', () => ({
  getJobPrepProject: (...args: unknown[]) => getJobPrepProject(...args),
  runInterviewQuestionGeneration: (...args: unknown[]) =>
    runInterviewQuestionGeneration(...args),
  retryInterviewQuestionGeneration: (...args: unknown[]) =>
    retryInterviewQuestionGeneration(...args),
  runResumeJobAnalysis: vi.fn(),
  retryResumeJobAnalysis: vi.fn(),
  runTailoredResumeGeneration: vi.fn(),
  retryTailoredResumeGeneration: vi.fn(),
}));

vi.mock('@/app/actions/job-prep-answers', () => ({
  startInterviewAnswerPractice: (...args: unknown[]) =>
    startInterviewAnswerPractice(...args),
}));

vi.mock('@/components/job-prep/JobPrepAnalysisPanel', () => ({
  JobPrepAnalysisPanel: () => <div data-testid="analysis-panel-stub" />,
}));

vi.mock('@/components/job-prep/JobPrepTailoredResumePanel', () => ({
  JobPrepTailoredResumePanel: () => <div data-testid="tailored-resume-panel-stub" />,
}));

/** Removed companion copy — must never appear after the duplication fix. */
const REMOVED_ASIDE_COPY =
  'Practice questions tailored to your résumé and this role.';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

function getMainInterviewQuestionsHeadings() {
  return screen.getAllByRole('heading', {
    level: 2,
    name: /^interview questions$/i,
  });
}

function countGenerateButtons() {
  return screen.queryAllByRole('button', {
    name: /generate personalized questions/i,
  }).length;
}

describe('JobPrepDetail interview questions section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewportWidth(1280);
    getJobPrepProject.mockResolvedValue({ project: null, error: null });
    runInterviewQuestionGeneration.mockResolvedValue({
      success: true,
      status: 'completed',
      error: null,
    });
    retryInterviewQuestionGeneration.mockResolvedValue({
      success: true,
      status: 'completed',
      error: null,
    });
    startInterviewAnswerPractice.mockResolvedValue({
      sessionId: 'session-1',
      reused: false,
      error: null,
    });
  });

  it('renders saved questions exactly once when questions exist', () => {
    const question = createInterviewQuestion();
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'completed',
      }),
      interview_questions: [question],
    });

    render(<JobPrepDetail project={project} />);

    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(screen.getByText(question.question_text)).toBeInTheDocument();
    expect(screen.getAllByText(question.question_text)).toHaveLength(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
    expect(countGenerateButtons()).toBe(0);
    expect(
      screen.getByRole('button', { name: /practice answer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /regenerate/i })
    ).toBeInTheDocument();
  });

  it('shows a single generate control when no questions exist', () => {
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'pending',
      }),
      interview_questions: [],
    });

    render(<JobPrepDetail project={project} />);

    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(countGenerateButtons()).toBe(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /practice answer/i })
    ).not.toBeInTheDocument();
  });

  it('shows generating state once while questions are processing', () => {
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'processing',
      }),
      interview_questions: [],
    });

    render(<JobPrepDetail project={project} />);

    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: /generating questions/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/generating questions/i)).toHaveLength(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
    expect(countGenerateButtons()).toBe(0);
  });

  it('shows failed generation UI once with retry', () => {
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'failed',
        error_message: 'Provider timed out',
      }),
      interview_questions: [],
    });

    render(<JobPrepDetail project={project} />);

    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
    expect(screen.getByText('Provider timed out')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /retry generation/i })).toHaveLength(
      1
    );
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
  });

  it('renders the interview questions section once on desktop widths', () => {
    setViewportWidth(1440);
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'pending',
      }),
    });

    const { container } = render(<JobPrepDetail project={project} />);

    expect(window.innerWidth).toBe(1440);
    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(countGenerateButtons()).toBe(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();

    const mainColumn = container.querySelector('.space-y-6');
    expect(mainColumn).toBeTruthy();
    expect(
      within(mainColumn as HTMLElement).getAllByRole('heading', {
        level: 2,
        name: /^interview questions$/i,
      })
    ).toHaveLength(1);
  });

  it('renders the interview questions section once on mobile widths', () => {
    setViewportWidth(390);
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'pending',
      }),
    });

    const { container } = render(<JobPrepDetail project={project} />);

    expect(window.innerWidth).toBe(390);
    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
    expect(countGenerateButtons()).toBe(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
    // Layout is CSS grid only — no duplicate md:hidden / hidden md:block variants.
    expect(container.querySelectorAll('[class*="md:hidden"]').length).toBe(0);
  });

  it('never mounts the removed pre-results companion Interview Questions section', () => {
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'pending',
      }),
      interview_questions: [],
    });

    render(<JobPrepDetail project={project} />);

    const companionLabels = screen.getAllByText('Companion');
    // Fit analysis companion remains; interview-questions companion must not.
    expect(companionLabels).toHaveLength(1);
    expect(screen.queryByText(REMOVED_ASIDE_COPY)).not.toBeInTheDocument();
    expect(countGenerateButtons()).toBe(1);
    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
  });

  it('keeps question actions working: generate and practice navigation', async () => {
    const user = userEvent.setup();
    const pendingProject = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'pending',
      }),
    });
    const completedProject = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'completed',
      }),
      interview_questions: [createInterviewQuestion()],
    });

    runInterviewQuestionGeneration.mockResolvedValue({
      success: true,
      status: 'completed',
      error: null,
    });
    getJobPrepProject.mockResolvedValue({
      project: completedProject,
      error: null,
    });

    const { unmount } = render(<JobPrepDetail project={pendingProject} />);

    await user.click(
      screen.getByRole('button', { name: /generate personalized questions/i })
    );

    expect(runInterviewQuestionGeneration).toHaveBeenCalledWith('project-1');

    unmount();
    render(<JobPrepDetail project={completedProject} />);

    await user.click(screen.getByRole('button', { name: /practice answer/i }));
    await user.click(screen.getByRole('button', { name: /audio answer/i }));

    expect(startInterviewAnswerPractice).toHaveBeenCalledWith('question-1', 'audio');
    expect(push).toHaveBeenCalledWith('/sessions/session-1');
  });

  it('keeps existing saved questions visible after the duplication fix', () => {
    const questions = [
      createInterviewQuestion({
        id: 'question-1',
        question_text: 'Saved behavioral question',
        question_type: 'behavioral',
        sort_order: 1,
      }),
      createInterviewQuestion({
        id: 'question-2',
        question_text: 'Saved technical question',
        question_type: 'technical',
        category: 'technical',
        sort_order: 2,
      }),
    ];
    const project = createJobPrepProject({
      interview_question_generation: createInterviewQuestionGeneration({
        status: 'completed',
      }),
      interview_questions: questions,
    });

    render(<JobPrepDetail project={project} />);

    expect(screen.getByText('Saved behavioral question')).toBeInTheDocument();
    expect(screen.getByText('Saved technical question')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /practice answer/i })).toHaveLength(
      2
    );
    expect(screen.getByText(/2 interview questions ready/i)).toBeInTheDocument();
    expect(getMainInterviewQuestionsHeadings()).toHaveLength(1);
  });
});

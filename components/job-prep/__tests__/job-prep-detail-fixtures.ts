import type {
  InterviewQuestion,
  InterviewQuestionGeneration,
  JobPrepProjectWithDetails,
  ResumeJobAnalysis,
} from '@/types';

const NOW = '2026-07-21T12:00:00.000Z';

const baseAnalysis: ResumeJobAnalysis = {
  id: 'analysis-1',
  user_id: 'user-1',
  project_id: 'project-1',
  resume_id: 'resume-1',
  job_description_id: 'jd-1',
  status: 'completed',
  summary: {
    overall_match_score: 82,
    missing_keywords: [],
    matched_skills: ['TypeScript'],
    weak_resume_sections: [],
    recommended_resume_changes: [],
    risk_flags: [],
    summary: 'Strong match overall.',
  },
  error_message: null,
  provider: 'openai',
  model: 'gpt-4o',
  created_at: NOW,
  updated_at: NOW,
};

export function createInterviewQuestion(
  overrides: Partial<InterviewQuestion> = {}
): InterviewQuestion {
  return {
    id: 'question-1',
    user_id: 'user-1',
    project_id: 'project-1',
    analysis_id: 'analysis-1',
    question_text: 'Tell me about a time you led a TypeScript migration.',
    category: 'behavioral',
    question_type: 'behavioral',
    difficulty: 'medium',
    what_good_answer_should_include: 'Situation, action, measurable outcome.',
    related_resume_section: 'Experience',
    related_job_requirement: 'TypeScript ownership',
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function createInterviewQuestionGeneration(
  overrides: Partial<InterviewQuestionGeneration> = {}
): InterviewQuestionGeneration {
  return {
    id: 'iq-gen-1',
    user_id: 'user-1',
    project_id: 'project-1',
    analysis_id: 'analysis-1',
    resume_id: 'resume-1',
    job_description_id: 'jd-1',
    status: 'pending',
    error_message: null,
    provider: null,
    model: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function createJobPrepProject(
  overrides: Partial<JobPrepProjectWithDetails> = {}
): JobPrepProjectWithDetails {
  return {
    id: 'project-1',
    user_id: 'user-1',
    title: 'Acme Platform Engineer Prep',
    status: 'ready',
    created_at: NOW,
    updated_at: NOW,
    job_description: {
      id: 'jd-1',
      user_id: 'user-1',
      project_id: 'project-1',
      title: 'Platform Engineer',
      company_name: 'Acme',
      role_title: 'Platform Engineer',
      content: 'Build reliable platform services.',
      created_at: NOW,
      updated_at: NOW,
    },
    resume: {
      id: 'resume-1',
      user_id: 'user-1',
      project_id: 'project-1',
      title: 'My Resume',
      content: 'Senior engineer with TypeScript experience.',
      source: 'paste',
      file_name: null,
      created_at: NOW,
      updated_at: NOW,
    },
    analysis: baseAnalysis,
    tailored_resume: null,
    interview_question_generation: null,
    interview_questions: [],
    ...overrides,
  };
}

// Supabase Edge Function: ai_run_job_prep_interview_questions
// Generates tailored interview questions from résumé, job description, and fit analysis.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';

type SupabaseServiceClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 90000;

const QUESTION_TYPE_COUNTS: Record<string, number> = {
  behavioral: 5,
  technical: 5,
  resume_specific: 5,
  gap_risk: 3,
  why_role_company: 3,
};

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_COUNTS);
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

type QuestionType = keyof typeof QUESTION_TYPE_COUNTS;
type Difficulty = (typeof DIFFICULTIES)[number];

interface GeneratedQuestion {
  question_text: string;
  question_type: QuestionType;
  difficulty: Difficulty;
  what_good_answer_should_include: string;
  related_resume_section: string;
  related_job_requirement: string;
}

function categoryFromQuestionType(questionType: QuestionType): string {
  switch (questionType) {
    case 'behavioral':
      return 'behavioral';
    case 'technical':
      return 'technical';
    case 'resume_specific':
    case 'gap_risk':
      return 'situational';
    case 'why_role_company':
      return 'general';
    default:
      return 'general';
  }
}

function buildPrompt(input: {
  resumeText: string;
  jobDescriptionText: string;
  fitAnalysisContext: string;
  companyName: string;
  roleTitle: string;
}): { systemPrompt: string; userPrompt: string } {
  const basePreamble =
    'You are an expert interview coach. ' +
    'You must respond with a single valid JSON object and nothing else - no markdown, no code fences, no explanation text.';

  const countsDescription = QUESTION_TYPES.map(
    (type) => `- ${type}: exactly ${QUESTION_TYPE_COUNTS[type]} questions`
  ).join('\n');

  return {
    systemPrompt:
      `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
      `{"questions": [{"question_text": string, "question_type": string, "difficulty": string, "what_good_answer_should_include": string, "related_resume_section": string, "related_job_requirement": string}]}\n\n` +
      `Generate exactly 21 interview questions with these counts:\n${countsDescription}\n\n` +
      `Field rules:\n` +
      `- question_type: one of ${QUESTION_TYPES.join(', ')}\n` +
      `- difficulty: one of easy, medium, hard\n` +
      `- question_text: specific, realistic interview question tailored to this candidate and role\n` +
      `- what_good_answer_should_include: 2-4 sentences on structure, evidence, and themes a strong answer should cover\n` +
      `- related_resume_section: résumé section or experience this question probes (e.g. "Acme Corp — Senior Engineer, 2021-2024")\n` +
      `- related_job_requirement: job requirement or responsibility from the posting this question assesses\n\n` +
      `Type guidance:\n` +
      `- behavioral: STAR-style past-behavior questions tied to role competencies\n` +
      `- technical: role-relevant skills, tools, system design, or domain knowledge\n` +
      `- resume_specific: deep dives on claims, projects, and bullets from the résumé\n` +
      `- gap_risk: address weak matches, missing keywords, or risk flags from fit analysis\n` +
      `- why_role_company: motivation, culture fit, and role/company alignment\n\n` +
      `Do not invent résumé experience. Ground questions in the provided résumé, job description, and fit analysis.`,
    userPrompt:
      `TARGET ROLE: ${input.roleTitle || 'Not specified'}\n` +
      `COMPANY: ${input.companyName || 'Not specified'}\n\n---\n\n` +
      `JOB DESCRIPTION:\n\n${input.jobDescriptionText}\n\n---\n\n` +
      `RÉSUMÉ:\n\n${input.resumeText}\n\n---\n\n` +
      `FIT ANALYSIS:\n\n${input.fitAnalysisContext || 'Not available.'}`,
  };
}

function isValidQuestion(item: unknown): item is GeneratedQuestion {
  if (!item || typeof item !== 'object') return false;
  const q = item as Record<string, unknown>;

  return (
    typeof q.question_text === 'string' &&
    q.question_text.trim().length > 0 &&
    typeof q.question_type === 'string' &&
    QUESTION_TYPES.includes(q.question_type) &&
    typeof q.difficulty === 'string' &&
    DIFFICULTIES.includes(q.difficulty as Difficulty) &&
    typeof q.what_good_answer_should_include === 'string' &&
    q.what_good_answer_should_include.trim().length > 0 &&
    typeof q.related_resume_section === 'string' &&
    q.related_resume_section.trim().length > 0 &&
    typeof q.related_job_requirement === 'string' &&
    q.related_job_requirement.trim().length > 0
  );
}

function validateQuestionCounts(questions: GeneratedQuestion[]): string | null {
  const counts: Record<string, number> = {};
  for (const type of QUESTION_TYPES) {
    counts[type] = 0;
  }

  for (const question of questions) {
    counts[question.question_type] += 1;
  }

  for (const type of QUESTION_TYPES) {
    if (counts[type] !== QUESTION_TYPE_COUNTS[type]) {
      return `Expected ${QUESTION_TYPE_COUNTS[type]} ${type} questions but received ${counts[type]}.`;
    }
  }

  return null;
}

async function callOpenAI(
  input: {
    resumeText: string;
    jobDescriptionText: string;
    fitAnalysisContext: string;
    companyName: string;
    roleTitle: string;
  },
  apiKey: string
): Promise<GeneratedQuestion[]> {
  const { systemPrompt, userPrompt } = buildPrompt(input);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.35,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        errorDetail = await response.text();
      } catch {
        // ignore
      }
      throw new Error(
        `OpenAI API returned an error (status ${response.status}): ${errorDetail.slice(0, 500)}`
      );
    }

    const responseBody = await response.json();
    const messageContent = (
      responseBody as { choices?: Array<{ message?: { content?: string } }> }
    )?.choices?.[0]?.message?.content;

    if (!messageContent || typeof messageContent !== 'string') {
      throw new Error('OpenAI API response did not include message content.');
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(messageContent);
    } catch {
      throw new Error('OpenAI returned content that was not valid JSON.');
    }

    if (!parsedContent || typeof parsedContent !== 'object') {
      throw new Error('OpenAI returned JSON without a questions array.');
    }

    const questions = (parsedContent as { questions?: unknown }).questions;
    if (!Array.isArray(questions)) {
      throw new Error('OpenAI returned JSON without a questions array.');
    }

    if (questions.length !== 21) {
      throw new Error(`OpenAI returned ${questions.length} questions; expected exactly 21.`);
    }

    if (!questions.every(isValidQuestion)) {
      throw new Error(
        'OpenAI returned questions that did not match the expected interview question shape.'
      );
    }

    const countError = validateQuestionCounts(questions);
    if (countError) {
      throw new Error(countError);
    }

    return questions;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenAI request timed out.');
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function markGenerationFailed(
  serviceClient: SupabaseServiceClient,
  generationId: string,
  errorMessage: string
): Promise<void> {
  await serviceClient
    .from('interview_question_generations')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', generationId);
}

function sortQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const typeOrder = QUESTION_TYPES as QuestionType[];
  return [...questions].sort((a, b) => {
    const typeDiff =
      typeOrder.indexOf(a.question_type) - typeOrder.indexOf(b.question_type);
    if (typeDiff !== 0) return typeDiff;
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { generation_id } = body;

    if (!generation_id) {
      return new Response(
        JSON.stringify({ error: 'generation_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: generation, error: generationError } = await serviceClient
      .from('interview_question_generations')
      .select('*')
      .eq('id', generation_id)
      .single();

    if (generationError || !generation) {
      return new Response(JSON.stringify({ error: 'Generation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (generation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to run this generation' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (generation.status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: `Generation cannot be run. Current status: ${generation.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateProcessingError } = await serviceClient
      .from('interview_question_generations')
      .update({
        status: 'processing',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation_id);

    if (updateProcessingError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update generation status to processing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const [
      { data: resume, error: resumeError },
      { data: jobDescription, error: jobDescriptionError },
      { data: analysis, error: analysisError },
    ] = await Promise.all([
      serviceClient
        .from('resumes')
        .select('content')
        .eq('id', generation.resume_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('job_descriptions')
        .select('content, company_name, role_title')
        .eq('id', generation.job_description_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('resume_job_analyses')
        .select('summary, status')
        .eq('id', generation.analysis_id)
        .eq('user_id', user.id)
        .single(),
    ]);

    if (resumeError || !resume?.content?.trim()) {
      const message = 'Résumé text is missing for this generation.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (jobDescriptionError || !jobDescription?.content?.trim()) {
      const message = 'Job description text is missing for this generation.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (analysisError || !analysis || analysis.status !== 'completed' || !analysis.summary) {
      const message = 'Completed fit analysis is required before generating interview questions.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      const message = 'OpenAI API key is not configured.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let questions: GeneratedQuestion[];
    try {
      questions = await callOpenAI(
        {
          resumeText: resume.content.trim(),
          jobDescriptionText: jobDescription.content.trim(),
          fitAnalysisContext: JSON.stringify(analysis.summary, null, 2),
          companyName: jobDescription.company_name ?? '',
          roleTitle: jobDescription.role_title ?? '',
        },
        openaiApiKey
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate interview questions.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sortedQuestions = sortQuestions(questions);

    const { error: deleteError } = await serviceClient
      .from('interview_questions')
      .delete()
      .eq('project_id', generation.project_id)
      .eq('user_id', user.id);

    if (deleteError) {
      const message = 'Failed to clear previous interview questions.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = sortedQuestions.map((question, index) => ({
      user_id: user.id,
      project_id: generation.project_id,
      analysis_id: generation.analysis_id,
      question_text: question.question_text.trim(),
      category: categoryFromQuestionType(question.question_type),
      question_type: question.question_type,
      difficulty: question.difficulty,
      what_good_answer_should_include: question.what_good_answer_should_include.trim(),
      related_resume_section: question.related_resume_section.trim(),
      related_job_requirement: question.related_job_requirement.trim(),
      sort_order: index,
    }));

    const { error: insertError } = await serviceClient
      .from('interview_questions')
      .insert(rows);

    if (insertError) {
      const message = 'Failed to save interview questions.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateCompletedError } = await serviceClient
      .from('interview_question_generations')
      .update({
        status: 'completed',
        error_message: null,
        provider: 'openai',
        model: OPENAI_MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation_id);

    if (updateCompletedError) {
      const message = 'Failed to mark interview question generation as completed.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        generation_id,
        status: 'completed',
        question_count: rows.length,
        message: 'Interview questions generated successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Supabase Edge Function: ai_run_job_prep_answer_rating
// Rates a recorded Job Prep interview answer using question, JD, résumé, and transcript.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';

type SupabaseServiceClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 60000;

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

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface RatingResult {
  overall_score: number;
  category_scores: Record<CategoryKey, number>;
  what_went_well: string[];
  what_was_missing: string[];
  improved_sample_answer: string;
  next_practice_tip: string;
}

function buildPrompt(input: {
  questionText: string;
  questionType: string;
  difficulty: string;
  whatGoodAnswerShouldInclude: string;
  relatedResumeSection: string;
  relatedJobRequirement: string;
  jobDescriptionText: string;
  resumeText: string;
  answerTranscript: string;
  companyName: string;
  roleTitle: string;
}): { systemPrompt: string; userPrompt: string } {
  const basePreamble =
    'You are an expert interview coach evaluating a candidate practice answer. ' +
    'You must respond with a single valid JSON object and nothing else - no markdown, no code fences, no explanation text.';

  const categoryList = CATEGORY_KEYS.join(', ');

  return {
    systemPrompt:
      `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
      `{"overall_score": number, "category_scores": {"relevance": number, "structure": number, "clarity": number, "confidence": number, "completeness": number, "job_alignment": number, "examples_evidence": number, "conciseness": number}, "what_went_well": string[], "what_was_missing": string[], "improved_sample_answer": string, "next_practice_tip": string}\n\n` +
      `Score each category and overall_score as integers from 0 to 100.\n` +
      `Category definitions:\n` +
      `- relevance: Does the answer address the question asked?\n` +
      `- structure: Logical flow (e.g. STAR for behavioral), clear opening and close\n` +
      `- clarity: Easy to follow language, precise wording, minimal rambling\n` +
      `- confidence: Decisive tone; avoids excessive hedging (infer from transcript wording)\n` +
      `- completeness: Covers key points the question and rubric expect\n` +
      `- job_alignment: Connects experience to this role and job requirements\n` +
      `- examples_evidence: Uses concrete examples, metrics, or outcomes from the résumé\n` +
      `- conciseness: Appropriate length; no major filler or repetition\n\n` +
      `Output rules:\n` +
      `- category_scores must include exactly these keys: ${categoryList}\n` +
      `- what_went_well: 2-5 specific strengths observed in the transcript\n` +
      `- what_was_missing: 2-5 specific gaps or weaknesses\n` +
      `- improved_sample_answer: A stronger rewritten answer grounded in the résumé; do NOT invent employers, titles, or metrics not supported by the résumé\n` +
      `- next_practice_tip: One actionable tip for the next practice attempt\n` +
      `- Base scores only on the transcript provided; if the transcript is very short or off-topic, score accordingly`,
    userPrompt:
      `TARGET ROLE: ${input.roleTitle || 'Not specified'}\n` +
      `COMPANY: ${input.companyName || 'Not specified'}\n\n---\n\n` +
      `INTERVIEW QUESTION:\n${input.questionText}\n\n` +
      `Question type: ${input.questionType}\n` +
      `Difficulty: ${input.difficulty}\n\n` +
      `What a strong answer should include:\n${input.whatGoodAnswerShouldInclude}\n\n` +
      `Related résumé section:\n${input.relatedResumeSection}\n\n` +
      `Related job requirement:\n${input.relatedJobRequirement}\n\n---\n\n` +
      `JOB DESCRIPTION:\n\n${input.jobDescriptionText}\n\n---\n\n` +
      `RÉSUMÉ:\n\n${input.resumeText}\n\n---\n\n` +
      `CANDIDATE ANSWER TRANSCRIPT:\n\n${input.answerTranscript}`,
  };
}

function isValidRatingOutput(content: unknown): content is RatingResult {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;

  const isStringArray = (value: unknown) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  if (typeof c.overall_score !== 'number' || c.overall_score < 0 || c.overall_score > 100) {
    return false;
  }

  if (!c.category_scores || typeof c.category_scores !== 'object') {
    return false;
  }

  const scores = c.category_scores as Record<string, unknown>;
  for (const key of CATEGORY_KEYS) {
    const score = scores[key];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return false;
    }
  }

  return (
    isStringArray(c.what_went_well) &&
    c.what_went_well.length > 0 &&
    isStringArray(c.what_was_missing) &&
    c.what_was_missing.length > 0 &&
    typeof c.improved_sample_answer === 'string' &&
    c.improved_sample_answer.trim().length > 0 &&
    typeof c.next_practice_tip === 'string' &&
    c.next_practice_tip.trim().length > 0
  );
}

async function callOpenAI(
  input: Parameters<typeof buildPrompt>[0],
  apiKey: string
): Promise<RatingResult> {
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
        temperature: 0.25,
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

    if (!isValidRatingOutput(parsedContent)) {
      throw new Error(
        'OpenAI returned JSON that did not match the expected answer rating shape.'
      );
    }

    return parsedContent;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenAI request timed out.');
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getTranscriptForSession(
  serviceClient: SupabaseServiceClient,
  userId: string,
  sessionId: string
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from('transcripts_manual')
    .select('provider, content')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .in('provider', ['openai', 'manual']);

  if (error || !data) {
    return null;
  }

  const openai = data.find((row) => row.provider === 'openai' && row.content?.trim());
  if (openai?.content?.trim()) {
    return openai.content.trim();
  }

  const manual = data.find((row) => row.provider === 'manual' && row.content?.trim());
  return manual?.content?.trim() ?? null;
}

async function markAttemptFailed(
  serviceClient: SupabaseServiceClient,
  attemptId: string,
  errorMessage: string
): Promise<void> {
  await serviceClient
    .from('interview_answer_attempts')
    .update({
      rating_status: 'failed',
      rating_error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId);
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
    const { attempt_id } = body;

    if (!attempt_id) {
      return new Response(JSON.stringify({ error: 'attempt_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const { data: attempt, error: attemptError } = await serviceClient
      .from('interview_answer_attempts')
      .select('*')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Answer attempt not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to rate this answer' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (attempt.rating_status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: `Rating cannot be run. Current status: ${attempt.rating_status ?? 'not started'}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!attempt.session_id) {
      const message = 'A recorded session is required before rating this answer.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateProcessingError } = await serviceClient
      .from('interview_answer_attempts')
      .update({
        rating_status: 'processing',
        rating_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt_id);

    if (updateProcessingError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update rating status to processing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const [
      { data: question, error: questionError },
      { data: resume, error: resumeError },
      { data: jobDescription, error: jobDescriptionError },
      transcript,
    ] = await Promise.all([
      serviceClient
        .from('interview_questions')
        .select('*')
        .eq('id', attempt.question_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('resumes')
        .select('content')
        .eq('project_id', attempt.project_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('job_descriptions')
        .select('content, company_name, role_title')
        .eq('project_id', attempt.project_id)
        .eq('user_id', user.id)
        .single(),
      getTranscriptForSession(serviceClient, user.id, attempt.session_id),
    ]);

    if (questionError || !question) {
      const message = 'Interview question not found for this answer attempt.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resumeError || !resume?.content?.trim()) {
      const message = 'Résumé text is missing for this answer attempt.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (jobDescriptionError || !jobDescription?.content?.trim()) {
      const message = 'Job description text is missing for this answer attempt.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!transcript) {
      const message =
        'Answer transcript is required. Wait for automatic transcription or paste a transcript on the session page.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      const message = 'OpenAI API key is not configured.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let rating: RatingResult;
    try {
      rating = await callOpenAI(
        {
          questionText: question.question_text,
          questionType: question.question_type,
          difficulty: question.difficulty,
          whatGoodAnswerShouldInclude: question.what_good_answer_should_include,
          relatedResumeSection: question.related_resume_section,
          relatedJobRequirement: question.related_job_requirement,
          jobDescriptionText: jobDescription.content.trim(),
          resumeText: resume.content.trim(),
          answerTranscript: transcript,
          companyName: jobDescription.company_name ?? '',
          roleTitle: jobDescription.role_title ?? '',
        },
        openaiApiKey
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to rate interview answer.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateCompletedError } = await serviceClient
      .from('interview_answer_attempts')
      .update({
        rating_status: 'completed',
        rating_result: rating,
        rating_error_message: null,
        answer_text: transcript,
        rating_provider: 'openai',
        rating_model: OPENAI_MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt_id);

    if (updateCompletedError) {
      const message = 'Failed to save answer rating results.';
      await markAttemptFailed(serviceClient, attempt_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        attempt_id,
        status: 'completed',
        message: 'Answer rated successfully',
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

// Supabase Edge Function: ai_run_job
// Processes AI jobs. 'summary', 'score', and 'action_items' call OpenAI (gpt-4o-mini)
// using the session's manual transcript as input. 'transcript' and 'suggest_bookmarks'
// still use placeholder output (not implemented yet).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job types that are backed by real OpenAI calls (as opposed to placeholder output)
const AI_GENERATED_JOB_TYPES = new Set(['summary', 'score', 'action_items']);

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 30000;

// Placeholder outputs for job types that don't call OpenAI yet
function getPlaceholderOutput(jobType: string): Record<string, unknown> {
  switch (jobType) {
    case 'transcript':
      return {
        transcript:
          'Placeholder transcript content.\n\n[00:00] Interviewer: Hello, thank you for joining us today.\n\n[00:05] Candidate: Thank you for having me. I am excited about this opportunity.\n\n[00:12] Interviewer: Let us start with your background.\n\n[00:15] Candidate: I have been working in software development for 5 years...',
      };
    case 'suggest_bookmarks':
      return {
        bookmarks: [
          { timestamp_ms: 15000, label: 'Introduction and greeting', category: 'opening' },
          { timestamp_ms: 45000, label: 'Discussed previous project experience', category: 'experience' },
          { timestamp_ms: 120000, label: 'Technical deep-dive on system design', category: 'technical' },
          { timestamp_ms: 180000, label: 'Behavioral question response', category: 'behavioral' },
          { timestamp_ms: 240000, label: 'Questions for the interviewer', category: 'closing' },
        ],
      };
    default:
      return { message: 'Unknown job type', jobType };
  }
}

// Builds the system/user prompt pair for a given AI-generated job type
function buildPrompt(jobType: string, transcript: string): { systemPrompt: string; userPrompt: string } {
  const basePreamble =
    'You are an assistant that analyzes interview session transcripts. ' +
    'You must respond with a single valid JSON object and nothing else - no markdown, no code fences, no explanation text.';

  switch (jobType) {
    case 'summary':
      return {
        systemPrompt:
          `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
          `{"summary": string, "bullets": string[], "confidence": number}\n` +
          `"summary" is a concise paragraph summarizing the session. "bullets" is an array of 3-6 key points. ` +
          `"confidence" is a number between 0 and 1 representing your confidence in this summary.`,
        userPrompt: `Here is the interview transcript:\n\n${transcript}`,
      };
    case 'score':
      return {
        systemPrompt:
          `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
          `{"score": number, "rubric": [{"name": string, "score": number, "maxScore": number, "feedback": string}], "overallFeedback": string}\n` +
          `"score" is an overall score from 0-100. "rubric" contains 4-6 categories (e.g. Clarity, Technical Knowledge, ` +
          `Communication, Problem Solving) each with a "name", a "score" from 0-10, "maxScore" set to exactly 10, and short "feedback". ` +
          `"overallFeedback" is a short summary paragraph.`,
        userPrompt: `Here is the interview transcript:\n\n${transcript}`,
      };
    case 'action_items':
      return {
        systemPrompt:
          `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
          `{"items": [{"title": string, "description": string, "priority": "high" | "medium" | "low"}]}\n` +
          `Identify 3-6 concrete, actionable follow-up items for the candidate based on the transcript. ` +
          `"priority" must be exactly one of "high", "medium", or "low".`,
        userPrompt: `Here is the interview transcript:\n\n${transcript}`,
      };
    default:
      throw new Error(`No prompt defined for job type: ${jobType}`);
  }
}

// Basic structural validation for OpenAI's parsed JSON output, per job type
function isValidOutputShape(jobType: string, content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;

  switch (jobType) {
    case 'summary':
      return typeof c.summary === 'string' && Array.isArray(c.bullets) && typeof c.confidence === 'number';
    case 'score':
      return (
        typeof c.score === 'number' &&
        Array.isArray(c.rubric) &&
        c.rubric.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof (item as Record<string, unknown>).name === 'string' &&
            typeof (item as Record<string, unknown>).score === 'number' &&
            typeof (item as Record<string, unknown>).feedback === 'string'
        ) &&
        typeof c.overallFeedback === 'string'
      );
    case 'action_items':
      return Array.isArray(c.items);
    default:
      return false;
  }
}

// Calls the OpenAI Chat Completions API and returns the parsed JSON content.
// Throws an Error with a descriptive message on any failure (timeout, non-200, invalid JSON, etc).
async function callOpenAI(
  jobType: string,
  transcript: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const { systemPrompt, userPrompt } = buildPrompt(jobType, transcript);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  // The timeout must stay active for the full request lifecycle - not just
  // until the response headers arrive, but through reading and parsing the
  // response body too - so everything below runs inside this try/finally.
  try {
    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
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
          temperature: 0.4,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('OpenAI request timed out.');
      }
      throw new Error(`Failed to reach OpenAI API: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!response.ok) {
      let errorDetail = '';
      try {
        errorDetail = await response.text();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('OpenAI request timed out.');
        }
        // ignore other read errors - use empty detail
      }
      throw new Error(`OpenAI API returned an error (status ${response.status}): ${errorDetail.slice(0, 500)}`);
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('OpenAI request timed out.');
      }
      throw new Error('OpenAI API returned a response that could not be parsed as JSON.');
    }

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

    if (!isValidOutputShape(jobType, parsedContent)) {
      throw new Error('OpenAI returned JSON that did not match the expected shape.');
    }

    if (jobType === 'score') {
      // Force maxScore to 10 for every rubric item, regardless of what the model returned
      const content = parsedContent as Record<string, unknown>;
      content.rubric = (content.rubric as Array<Record<string, unknown>>).map((item) => ({
        ...item,
        maxScore: 10,
      }));
    }

    return parsedContent as Record<string, unknown>;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Marks a job as failed with the given error message
async function markJobFailed(
  // deno-lint-ignore no-explicit-any
  serviceClient: any,
  jobId: string,
  errorMessage: string
): Promise<void> {
  await serviceClient
    .from('ai_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract and validate the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { job_id } = body;

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create Supabase clients
    // User client (with user's JWT) - for reading data with RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Service role client - for database writes (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 4. Get the authenticated user from the JWT
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Load the ai_jobs row and verify ownership
    const { data: job, error: jobError } = await serviceClient
      .from('ai_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the job belongs to the authenticated user
    if (job.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to run this job' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if job is in a valid state to run
    if (job.status !== 'queued') {
      return new Response(
        JSON.stringify({ error: `Job cannot be run. Current status: ${job.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Update job status to 'processing'
    const { error: updateProcessingError } = await serviceClient
      .from('ai_jobs')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (updateProcessingError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update job status to processing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Generate output content based on job type
    let outputContent: Record<string, unknown>;
    let resultProvider: string;
    let resultModel: string;

    if (AI_GENERATED_JOB_TYPES.has(job.job_type)) {
      // 7a. Ensure the OpenAI API key is configured
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        await markJobFailed(serviceClient, job_id, 'OpenAI API key is not configured.');
        return new Response(
          JSON.stringify({ error: 'OpenAI API key is not configured.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 7b. Load the manual transcript for this session
      const { data: transcriptRow, error: transcriptError } = await serviceClient
        .from('transcripts_manual')
        .select('content')
        .eq('session_id', job.session_id)
        .eq('user_id', job.user_id)
        .eq('provider', 'manual')
        .maybeSingle();

      if (transcriptError) {
        await markJobFailed(serviceClient, job_id, 'Failed to load transcript for this session.');
        return new Response(
          JSON.stringify({ error: 'Failed to load transcript for this session.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const transcriptText = transcriptRow?.content?.trim();
      if (!transcriptText) {
        const message = 'No transcript available for this session.';
        await markJobFailed(serviceClient, job_id, message);
        return new Response(
          JSON.stringify({ error: message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 7c. Call OpenAI
      try {
        outputContent = await callOpenAI(job.job_type, transcriptText, openaiApiKey);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate AI output.';
        await markJobFailed(serviceClient, job_id, message);
        return new Response(
          JSON.stringify({ error: message }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      resultProvider = 'openai';
      resultModel = OPENAI_MODEL;
    } else {
      // Existing placeholder path for 'transcript' and 'suggest_bookmarks'
      outputContent = getPlaceholderOutput(job.job_type);
      resultProvider = 'placeholder';
      resultModel = 'mock-v1';
    }

    // 8. Insert output into ai_outputs
    const { error: outputError } = await serviceClient.from('ai_outputs').insert({
      user_id: user.id,
      session_id: job.session_id,
      job_id: job_id,
      output_type: job.job_type,
      content: outputContent,
      created_at: new Date().toISOString(),
    });

    if (outputError) {
      // If output insertion fails, mark job as failed
      await markJobFailed(serviceClient, job_id, 'Failed to insert output');

      return new Response(
        JSON.stringify({ error: 'Failed to create output' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Update job status to 'completed'
    const { error: updateCompletedError } = await serviceClient
      .from('ai_jobs')
      .update({
        status: 'completed',
        provider: resultProvider,
        model: resultModel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (updateCompletedError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update job status to completed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Return success response
    return new Response(
      JSON.stringify({
        job_id: job_id,
        status: 'completed',
        message: 'Job completed successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

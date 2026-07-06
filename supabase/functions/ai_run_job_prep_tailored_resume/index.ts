// Supabase Edge Function: ai_run_job_prep_tailored_resume
// Generates a job-tailored résumé from existing résumé + profile + job description only.

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

function buildPrompt(input: {
  resumeText: string;
  jobDescriptionText: string;
  profileContext: string;
  fitAnalysisContext: string;
}): { systemPrompt: string; userPrompt: string } {
  const basePreamble =
    'You are an expert résumé editor focused on truthfulness. ' +
    'You must respond with a single valid JSON object and nothing else - no markdown, no code fences, no explanation text.';

  return {
    systemPrompt:
      `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
      `{"tailored_resume_text": string, "change_summary": string[], "truthfulness_warnings": string[], "suggested_additions_user_must_confirm": string[]}\n\n` +
      `Strict rules:\n` +
      `- NEVER invent experience, employers, titles, dates, credentials, certifications, metrics, or skills.\n` +
      `- ONLY reword, reorder, and prioritize content that appears in the SOURCE RÉSUMÉ or SAVED PROFILE.\n` +
      `- You may emphasize matching technologies and outcomes already stated in the source material.\n` +
      `- If the job description asks for something missing from the source material, list it in truthfulness_warnings or suggested_additions_user_must_confirm — do NOT add it to tailored_resume_text.\n` +
      `- tailored_resume_text: full résumé plain text tailored to the job (no fabricated content)\n` +
      `- change_summary: 4-10 bullets describing what was reworded/reordered/emphasized\n` +
      `- truthfulness_warnings: gaps, missing keywords, or weak matches flagged honestly (use [] if none)\n` +
      `- suggested_additions_user_must_confirm: items the user could add IF true — never present as fact (use [] if none)`,
    userPrompt:
      `JOB DESCRIPTION:\n\n${input.jobDescriptionText}\n\n---\n\n` +
      `SOURCE RÉSUMÉ:\n\n${input.resumeText}\n\n---\n\n` +
      `SAVED PROFILE:\n\n${input.profileContext || 'No additional profile details saved.'}\n\n---\n\n` +
      `FIT ANALYSIS (reference only — do not invent beyond source résumé/profile):\n\n` +
      `${input.fitAnalysisContext || 'Not available.'}`,
  };
}

function isValidTailoredResumeOutput(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;

  const isStringArray = (value: unknown) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  return (
    typeof c.tailored_resume_text === 'string' &&
    c.tailored_resume_text.trim().length > 0 &&
    isStringArray(c.change_summary) &&
    isStringArray(c.truthfulness_warnings) &&
    isStringArray(c.suggested_additions_user_must_confirm)
  );
}

async function callOpenAI(
  input: {
    resumeText: string;
    jobDescriptionText: string;
    profileContext: string;
    fitAnalysisContext: string;
  },
  apiKey: string
): Promise<Record<string, unknown>> {
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
        temperature: 0.2,
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

    if (!isValidTailoredResumeOutput(parsedContent)) {
      throw new Error(
        'OpenAI returned JSON that did not match the expected tailored résumé shape.'
      );
    }

    return parsedContent as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenAI request timed out.');
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatProfileContext(profile: {
  email?: string | null;
  full_name?: string | null;
  company?: string | null;
  job_title?: string | null;
} | null): string {
  if (!profile) return '';

  const lines = [
    profile.full_name ? `Name: ${profile.full_name}` : null,
    profile.email ? `Email: ${profile.email}` : null,
    profile.job_title ? `Current/target role: ${profile.job_title}` : null,
    profile.company ? `Company: ${profile.company}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function markGenerationFailed(
  serviceClient: SupabaseServiceClient,
  generationId: string,
  errorMessage: string
): Promise<void> {
  await serviceClient
    .from('tailored_resume_generations')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', generationId);
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
      .from('tailored_resume_generations')
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
      .from('tailored_resume_generations')
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
      { data: profile },
      { data: analysis },
    ] = await Promise.all([
      serviceClient
        .from('resumes')
        .select('content')
        .eq('id', generation.resume_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('job_descriptions')
        .select('content')
        .eq('id', generation.job_description_id)
        .eq('user_id', user.id)
        .single(),
      serviceClient
        .from('profiles')
        .select('email, full_name, company, job_title')
        .eq('user_id', user.id)
        .maybeSingle(),
      serviceClient
        .from('resume_job_analyses')
        .select('summary, status')
        .eq('project_id', generation.project_id)
        .eq('user_id', user.id)
        .maybeSingle(),
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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      const message = 'OpenAI API key is not configured.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fitAnalysisContext =
      analysis?.status === 'completed' && analysis.summary
        ? JSON.stringify(analysis.summary, null, 2)
        : '';

    let outputContent: Record<string, unknown>;
    try {
      outputContent = await callOpenAI(
        {
          resumeText: resume.content.trim(),
          jobDescriptionText: jobDescription.content.trim(),
          profileContext: formatProfileContext(profile),
          fitAnalysisContext,
        },
        openaiApiKey
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate tailored résumé.';
      await markGenerationFailed(serviceClient, generation_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateCompletedError } = await serviceClient
      .from('tailored_resume_generations')
      .update({
        status: 'completed',
        result: outputContent,
        error_message: null,
        provider: 'openai',
        model: OPENAI_MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation_id);

    if (updateCompletedError) {
      const message = 'Failed to save tailored résumé results.';
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
        message: 'Tailored résumé generated successfully',
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

// Supabase Edge Function: ai_run_job_prep_analysis
// Compares resume text against a job description using OpenAI structured JSON output.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';

type SupabaseServiceClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 45000;

function buildPrompt(resumeText: string, jobDescriptionText: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  const basePreamble =
    'You are an expert career coach and resume analyst. ' +
    'You must respond with a single valid JSON object and nothing else - no markdown, no code fences, no explanation text.';

  return {
    systemPrompt:
      `${basePreamble}\n\nRespond with JSON matching exactly this shape:\n` +
      `{"overall_match_score": number, "missing_keywords": string[], "matched_skills": string[], ` +
      `"weak_resume_sections": string[], "recommended_resume_changes": string[], "risk_flags": string[], "summary": string}\n\n` +
      `Rules:\n` +
      `- overall_match_score must be an integer from 0 to 100\n` +
      `- missing_keywords: important JD terms absent or weak in the resume (max 12 items)\n` +
      `- matched_skills: skills/experiences that align well (max 12 items)\n` +
      `- weak_resume_sections: resume areas underselling the candidate for this role (max 8 items)\n` +
      `- recommended_resume_changes: specific actionable edits; do NOT rewrite the resume (max 8 items)\n` +
      `- risk_flags: concerns like missing must-haves or title mismatch (max 6 items); use [] if none\n` +
      `- summary: 2-4 sentence overview of fit`,
    userPrompt:
      `JOB DESCRIPTION:\n\n${jobDescriptionText}\n\n---\n\nRESUME:\n\n${resumeText}`,
  };
}

function isValidAnalysisOutput(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;

  const isStringArray = (value: unknown) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  return (
    typeof c.overall_match_score === 'number' &&
    c.overall_match_score >= 0 &&
    c.overall_match_score <= 100 &&
    isStringArray(c.missing_keywords) &&
    isStringArray(c.matched_skills) &&
    isStringArray(c.weak_resume_sections) &&
    isStringArray(c.recommended_resume_changes) &&
    isStringArray(c.risk_flags) &&
    typeof c.summary === 'string'
  );
}

async function callOpenAI(
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const { systemPrompt, userPrompt } = buildPrompt(resumeText, jobDescriptionText);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

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
          temperature: 0.3,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('OpenAI request timed out.');
      }
      throw new Error(
        `Failed to reach OpenAI API: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!response.ok) {
      let errorDetail = '';
      try {
        errorDetail = await response.text();
      } catch {
        // ignore read errors
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

    if (!isValidAnalysisOutput(parsedContent)) {
      throw new Error(
        'OpenAI returned JSON that did not match the expected analysis shape.'
      );
    }

    const content = parsedContent as Record<string, unknown>;
    content.overall_match_score = Math.round(content.overall_match_score as number);

    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function markAnalysisFailed(
  serviceClient: SupabaseServiceClient,
  analysisId: string,
  projectId: string,
  errorMessage: string
): Promise<void> {
  await serviceClient
    .from('resume_job_analyses')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', analysisId);

  await serviceClient
    .from('job_prep_projects')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
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
    const { analysis_id } = body;

    if (!analysis_id) {
      return new Response(
        JSON.stringify({ error: 'analysis_id is required' }),
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
      global: {
        headers: { Authorization: authHeader },
      },
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

    const { data: analysis, error: analysisError } = await serviceClient
      .from('resume_job_analyses')
      .select('*')
      .eq('id', analysis_id)
      .single();

    if (analysisError || !analysis) {
      return new Response(JSON.stringify({ error: 'Analysis not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (analysis.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to run this analysis' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (analysis.status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: `Analysis cannot be run. Current status: ${analysis.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateProcessingError } = await serviceClient
      .from('resume_job_analyses')
      .update({
        status: 'processing',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis_id);

    if (updateProcessingError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update analysis status to processing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await serviceClient
      .from('job_prep_projects')
      .update({
        status: 'analyzing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.project_id);

    const [{ data: resume, error: resumeError }, { data: jobDescription, error: jobDescriptionError }] =
      await Promise.all([
        serviceClient
          .from('resumes')
          .select('content')
          .eq('id', analysis.resume_id)
          .eq('user_id', user.id)
          .single(),
        serviceClient
          .from('job_descriptions')
          .select('content')
          .eq('id', analysis.job_description_id)
          .eq('user_id', user.id)
          .single(),
      ]);

    if (resumeError || !resume?.content?.trim()) {
      const message = 'Resume text is missing for this analysis.';
      await markAnalysisFailed(serviceClient, analysis_id, analysis.project_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (jobDescriptionError || !jobDescription?.content?.trim()) {
      const message = 'Job description text is missing for this analysis.';
      await markAnalysisFailed(serviceClient, analysis_id, analysis.project_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      const message = 'OpenAI API key is not configured.';
      await markAnalysisFailed(serviceClient, analysis_id, analysis.project_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let outputContent: Record<string, unknown>;
    try {
      outputContent = await callOpenAI(
        resume.content.trim(),
        jobDescription.content.trim(),
        openaiApiKey
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate resume fit analysis.';
      await markAnalysisFailed(serviceClient, analysis_id, analysis.project_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateCompletedError } = await serviceClient
      .from('resume_job_analyses')
      .update({
        status: 'completed',
        summary: outputContent,
        error_message: null,
        provider: 'openai',
        model: OPENAI_MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis_id);

    if (updateCompletedError) {
      const message = 'Failed to save analysis results.';
      await markAnalysisFailed(serviceClient, analysis_id, analysis.project_id, message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await serviceClient
      .from('job_prep_projects')
      .update({
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.project_id);

    return new Response(
      JSON.stringify({
        analysis_id,
        status: 'completed',
        message: 'Resume fit analysis completed successfully',
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

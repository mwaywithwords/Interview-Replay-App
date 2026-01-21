// Supabase Edge Function: ai_run_job
// Processes AI jobs with placeholder outputs (no real AI integration yet)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Placeholder outputs for each job type
function getPlaceholderOutput(jobType: string): Record<string, unknown> {
  switch (jobType) {
    case 'summary':
      return {
        summary: 'Placeholder summary of the interview session.',
        bullets: [
          'Candidate demonstrated strong communication skills',
          'Technical concepts were explained clearly',
          'Good use of examples from past experience',
          'Areas for improvement: could be more concise',
        ],
        confidence: 0.5,
      };
    case 'transcript':
      return {
        transcript:
          'Placeholder transcript content.\n\n[00:00] Interviewer: Hello, thank you for joining us today.\n\n[00:05] Candidate: Thank you for having me. I am excited about this opportunity.\n\n[00:12] Interviewer: Let us start with your background.\n\n[00:15] Candidate: I have been working in software development for 5 years...',
      };
    case 'score':
      return {
        score: 72,
        rubric: [
          { name: 'Clarity', score: 7, maxScore: 10, feedback: 'Responses were generally clear and well-structured.' },
          { name: 'Technical Knowledge', score: 8, maxScore: 10, feedback: 'Demonstrated solid technical understanding.' },
          { name: 'Communication', score: 7, maxScore: 10, feedback: 'Good verbal communication, could improve conciseness.' },
          { name: 'Problem Solving', score: 6, maxScore: 10, feedback: 'Showed logical thinking, but could elaborate more on approach.' },
        ],
        overallFeedback: 'Solid performance overall. Focus on being more concise and elaborating on problem-solving approaches.',
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

    // 7. Generate placeholder output based on job type
    const placeholderContent = getPlaceholderOutput(job.job_type);

    // 8. Insert placeholder output into ai_outputs
    const { error: outputError } = await serviceClient.from('ai_outputs').insert({
      user_id: user.id,
      session_id: job.session_id,
      job_id: job_id,
      output_type: job.job_type,
      content: placeholderContent,
      created_at: new Date().toISOString(),
    });

    if (outputError) {
      // If output insertion fails, mark job as failed
      await serviceClient
        .from('ai_jobs')
        .update({
          status: 'failed',
          error_message: 'Failed to insert output',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job_id);

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
        provider: 'placeholder',
        model: 'mock-v1',
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

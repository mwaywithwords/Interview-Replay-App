-- ============================================
-- Migration: Phase 1 Job Prep schema (complete)
-- ============================================
-- Idempotent migration for the full Job Prep workflow.
--
-- Core tables:
--   job_prep_projects, resumes, job_descriptions, resume_job_analyses,
--   interview_questions, interview_answer_attempts
--
-- Workflow support tables (also referenced by Job Prep code):
--   tailored_resume_generations, interview_question_generations
--
-- Prerequisites: auth.users, sessions table, update_updated_at_column()
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. HELPER: updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS job_prep_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'analyzing', 'ready', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'paste'
        CHECK (source IN ('paste', 'upload')),
    file_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    title TEXT,
    company_name TEXT,
    role_title TEXT,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS resume_job_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    summary JSONB,
    error_message TEXT,
    provider TEXT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES resume_job_analyses(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general'
        CHECK (category IN ('behavioral', 'technical', 'situational', 'general')),
    question_type TEXT NOT NULL DEFAULT 'behavioral'
        CHECK (question_type IN (
            'behavioral',
            'technical',
            'resume_specific',
            'gap_risk',
            'why_role_company'
        )),
    difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    what_good_answer_should_include TEXT NOT NULL DEFAULT '',
    related_resume_section TEXT NOT NULL DEFAULT '',
    related_job_requirement TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_answer_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    answer_text TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER,
    rating_status TEXT
        CHECK (rating_status IS NULL OR rating_status IN (
            'pending', 'processing', 'completed', 'failed'
        )),
    rating_result JSONB,
    rating_error_message TEXT,
    rating_provider TEXT,
    rating_model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. WORKFLOW SUPPORT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS tailored_resume_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB,
    error_message TEXT,
    provider TEXT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS interview_question_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES resume_job_analyses(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    provider TEXT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id)
);

-- ============================================
-- 4. UPGRADE EXISTING TABLES (partial installs)
-- ============================================

ALTER TABLE resume_job_analyses
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT;

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS question_type TEXT,
    ADD COLUMN IF NOT EXISTS difficulty TEXT,
    ADD COLUMN IF NOT EXISTS what_good_answer_should_include TEXT,
    ADD COLUMN IF NOT EXISTS related_resume_section TEXT,
    ADD COLUMN IF NOT EXISTS related_job_requirement TEXT;

UPDATE interview_questions
SET question_type = CASE
        WHEN category = 'behavioral' THEN 'behavioral'
        WHEN category = 'technical' THEN 'technical'
        WHEN category = 'situational' THEN 'resume_specific'
        ELSE 'behavioral'
    END
WHERE question_type IS NULL;

UPDATE interview_questions
SET difficulty = 'medium'
WHERE difficulty IS NULL;

UPDATE interview_questions
SET what_good_answer_should_include = COALESCE(what_good_answer_should_include, '');

UPDATE interview_questions
SET related_resume_section = COALESCE(related_resume_section, '');

UPDATE interview_questions
SET related_job_requirement = COALESCE(related_job_requirement, '');

ALTER TABLE interview_questions
    ALTER COLUMN question_type SET DEFAULT 'behavioral',
    ALTER COLUMN difficulty SET DEFAULT 'medium',
    ALTER COLUMN what_good_answer_should_include SET DEFAULT '',
    ALTER COLUMN related_resume_section SET DEFAULT '',
    ALTER COLUMN related_job_requirement SET DEFAULT '';

ALTER TABLE interview_questions
    ALTER COLUMN question_type SET NOT NULL,
    ALTER COLUMN difficulty SET NOT NULL,
    ALTER COLUMN what_good_answer_should_include SET NOT NULL,
    ALTER COLUMN related_resume_section SET NOT NULL,
    ALTER COLUMN related_job_requirement SET NOT NULL;

ALTER TABLE interview_questions
    DROP CONSTRAINT IF EXISTS interview_questions_question_type_check;

ALTER TABLE interview_questions
    ADD CONSTRAINT interview_questions_question_type_check
        CHECK (question_type IN (
            'behavioral',
            'technical',
            'resume_specific',
            'gap_risk',
            'why_role_company'
        ));

ALTER TABLE interview_questions
    DROP CONSTRAINT IF EXISTS interview_questions_difficulty_check;

ALTER TABLE interview_questions
    ADD CONSTRAINT interview_questions_difficulty_check
        CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE interview_answer_attempts
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rating_status TEXT,
    ADD COLUMN IF NOT EXISTS rating_result JSONB,
    ADD COLUMN IF NOT EXISTS rating_error_message TEXT,
    ADD COLUMN IF NOT EXISTS rating_provider TEXT,
    ADD COLUMN IF NOT EXISTS rating_model TEXT;

ALTER TABLE interview_answer_attempts
    DROP CONSTRAINT IF EXISTS interview_answer_attempts_rating_status_check;

ALTER TABLE interview_answer_attempts
    ADD CONSTRAINT interview_answer_attempts_rating_status_check
        CHECK (rating_status IS NULL OR rating_status IN (
            'pending', 'processing', 'completed', 'failed'
        ));

-- ============================================
-- 5. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_job_prep_projects_user_id
    ON job_prep_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_job_prep_projects_user_id_updated_at
    ON job_prep_projects(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_project_id ON resumes(project_id);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_project_id ON job_descriptions(project_id);

CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_user_id ON resume_job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_project_id ON resume_job_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_resume_id ON resume_job_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_job_description_id
    ON resume_job_analyses(job_description_id);

CREATE INDEX IF NOT EXISTS idx_interview_questions_user_id ON interview_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_project_id ON interview_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_analysis_id ON interview_questions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_project_sort
    ON interview_questions(project_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_user_id
    ON interview_answer_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_project_id
    ON interview_answer_attempts(project_id);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_question_id
    ON interview_answer_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_user_question_created
    ON interview_answer_attempts(user_id, question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_session_id
    ON interview_answer_attempts(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_answer_attempts_session_id_unique
    ON interview_answer_attempts(session_id)
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tailored_resume_generations_user_id
    ON tailored_resume_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resume_generations_project_id
    ON tailored_resume_generations(project_id);

CREATE INDEX IF NOT EXISTS idx_interview_question_generations_user_id
    ON interview_question_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_question_generations_project_id
    ON interview_question_generations(project_id);

-- ============================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_job_prep_projects_updated_at ON job_prep_projects;
CREATE TRIGGER update_job_prep_projects_updated_at
    BEFORE UPDATE ON job_prep_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;
CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resume_job_analyses_updated_at ON resume_job_analyses;
CREATE TRIGGER update_resume_job_analyses_updated_at
    BEFORE UPDATE ON resume_job_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_questions_updated_at ON interview_questions;
CREATE TRIGGER update_interview_questions_updated_at
    BEFORE UPDATE ON interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_answer_attempts_updated_at ON interview_answer_attempts;
CREATE TRIGGER update_interview_answer_attempts_updated_at
    BEFORE UPDATE ON interview_answer_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tailored_resume_generations_updated_at ON tailored_resume_generations;
CREATE TRIGGER update_tailored_resume_generations_updated_at
    BEFORE UPDATE ON tailored_resume_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_question_generations_updated_at ON interview_question_generations;
CREATE TRIGGER update_interview_question_generations_updated_at
    BEFORE UPDATE ON interview_question_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE job_prep_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answer_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resume_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_question_generations ENABLE ROW LEVEL SECURITY;

-- job_prep_projects
DROP POLICY IF EXISTS "Users can view own job prep projects" ON job_prep_projects;
CREATE POLICY "Users can view own job prep projects"
    ON job_prep_projects FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job prep projects" ON job_prep_projects;
CREATE POLICY "Users can insert own job prep projects"
    ON job_prep_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own job prep projects" ON job_prep_projects;
CREATE POLICY "Users can update own job prep projects"
    ON job_prep_projects FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job prep projects" ON job_prep_projects;
CREATE POLICY "Users can delete own job prep projects"
    ON job_prep_projects FOR DELETE
    USING (auth.uid() = user_id);

-- resumes
DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
CREATE POLICY "Users can insert own resumes"
    ON resumes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = resumes.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;
CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- job_descriptions
DROP POLICY IF EXISTS "Users can view own job descriptions" ON job_descriptions;
CREATE POLICY "Users can view own job descriptions"
    ON job_descriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job descriptions" ON job_descriptions;
CREATE POLICY "Users can insert own job descriptions"
    ON job_descriptions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = job_descriptions.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own job descriptions" ON job_descriptions;
CREATE POLICY "Users can update own job descriptions"
    ON job_descriptions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job descriptions" ON job_descriptions;
CREATE POLICY "Users can delete own job descriptions"
    ON job_descriptions FOR DELETE
    USING (auth.uid() = user_id);

-- resume_job_analyses
DROP POLICY IF EXISTS "Users can view own resume job analyses" ON resume_job_analyses;
CREATE POLICY "Users can view own resume job analyses"
    ON resume_job_analyses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resume job analyses" ON resume_job_analyses;
CREATE POLICY "Users can insert own resume job analyses"
    ON resume_job_analyses FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = resume_job_analyses.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = resume_job_analyses.resume_id
            AND resumes.user_id = auth.uid()
            AND resumes.project_id = resume_job_analyses.project_id
        )
        AND EXISTS (
            SELECT 1 FROM job_descriptions
            WHERE job_descriptions.id = resume_job_analyses.job_description_id
            AND job_descriptions.user_id = auth.uid()
            AND job_descriptions.project_id = resume_job_analyses.project_id
        )
    );

DROP POLICY IF EXISTS "Users can update own resume job analyses" ON resume_job_analyses;
CREATE POLICY "Users can update own resume job analyses"
    ON resume_job_analyses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resume job analyses" ON resume_job_analyses;
CREATE POLICY "Users can delete own resume job analyses"
    ON resume_job_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- interview_questions
DROP POLICY IF EXISTS "Users can view own interview questions" ON interview_questions;
CREATE POLICY "Users can view own interview questions"
    ON interview_questions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interview questions" ON interview_questions;
CREATE POLICY "Users can insert own interview questions"
    ON interview_questions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = interview_questions.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM resume_job_analyses
            WHERE resume_job_analyses.id = interview_questions.analysis_id
            AND resume_job_analyses.user_id = auth.uid()
            AND resume_job_analyses.project_id = interview_questions.project_id
        )
    );

DROP POLICY IF EXISTS "Users can update own interview questions" ON interview_questions;
CREATE POLICY "Users can update own interview questions"
    ON interview_questions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interview questions" ON interview_questions;
CREATE POLICY "Users can delete own interview questions"
    ON interview_questions FOR DELETE
    USING (auth.uid() = user_id);

-- interview_answer_attempts
DROP POLICY IF EXISTS "Users can view own interview answer attempts" ON interview_answer_attempts;
CREATE POLICY "Users can view own interview answer attempts"
    ON interview_answer_attempts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interview answer attempts" ON interview_answer_attempts;
CREATE POLICY "Users can insert own interview answer attempts"
    ON interview_answer_attempts FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = interview_answer_attempts.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM interview_questions
            WHERE interview_questions.id = interview_answer_attempts.question_id
            AND interview_questions.user_id = auth.uid()
            AND interview_questions.project_id = interview_answer_attempts.project_id
        )
        AND (
            interview_answer_attempts.session_id IS NULL
            OR EXISTS (
                SELECT 1 FROM sessions
                WHERE sessions.id = interview_answer_attempts.session_id
                AND sessions.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update own interview answer attempts" ON interview_answer_attempts;
CREATE POLICY "Users can update own interview answer attempts"
    ON interview_answer_attempts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interview answer attempts" ON interview_answer_attempts;
CREATE POLICY "Users can delete own interview answer attempts"
    ON interview_answer_attempts FOR DELETE
    USING (auth.uid() = user_id);

-- tailored_resume_generations
DROP POLICY IF EXISTS "Users can view own tailored resume generations" ON tailored_resume_generations;
CREATE POLICY "Users can view own tailored resume generations"
    ON tailored_resume_generations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tailored resume generations" ON tailored_resume_generations;
CREATE POLICY "Users can insert own tailored resume generations"
    ON tailored_resume_generations FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = tailored_resume_generations.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = tailored_resume_generations.resume_id
            AND resumes.user_id = auth.uid()
            AND resumes.project_id = tailored_resume_generations.project_id
        )
        AND EXISTS (
            SELECT 1 FROM job_descriptions
            WHERE job_descriptions.id = tailored_resume_generations.job_description_id
            AND job_descriptions.user_id = auth.uid()
            AND job_descriptions.project_id = tailored_resume_generations.project_id
        )
    );

DROP POLICY IF EXISTS "Users can update own tailored resume generations" ON tailored_resume_generations;
CREATE POLICY "Users can update own tailored resume generations"
    ON tailored_resume_generations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tailored resume generations" ON tailored_resume_generations;
CREATE POLICY "Users can delete own tailored resume generations"
    ON tailored_resume_generations FOR DELETE
    USING (auth.uid() = user_id);

-- interview_question_generations
DROP POLICY IF EXISTS "Users can view own interview question generations" ON interview_question_generations;
CREATE POLICY "Users can view own interview question generations"
    ON interview_question_generations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interview question generations" ON interview_question_generations;
CREATE POLICY "Users can insert own interview question generations"
    ON interview_question_generations FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM job_prep_projects
            WHERE job_prep_projects.id = interview_question_generations.project_id
            AND job_prep_projects.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM resume_job_analyses
            WHERE resume_job_analyses.id = interview_question_generations.analysis_id
            AND resume_job_analyses.user_id = auth.uid()
            AND resume_job_analyses.project_id = interview_question_generations.project_id
        )
        AND EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = interview_question_generations.resume_id
            AND resumes.user_id = auth.uid()
            AND resumes.project_id = interview_question_generations.project_id
        )
        AND EXISTS (
            SELECT 1 FROM job_descriptions
            WHERE job_descriptions.id = interview_question_generations.job_description_id
            AND job_descriptions.user_id = auth.uid()
            AND job_descriptions.project_id = interview_question_generations.project_id
        )
    );

DROP POLICY IF EXISTS "Users can update own interview question generations" ON interview_question_generations;
CREATE POLICY "Users can update own interview question generations"
    ON interview_question_generations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interview question generations" ON interview_question_generations;
CREATE POLICY "Users can delete own interview question generations"
    ON interview_question_generations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Migration complete
-- ============================================

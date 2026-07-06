-- ============================================
-- Migration: Add job prep feature tables
-- ============================================
-- This migration adds:
-- 1. job_prep_projects — user-owned prep workspaces
-- 2. resumes — resume text linked to a project
-- 3. job_descriptions — job description text linked to a project
-- 4. resume_job_analyses — resume/JD analysis records (AI-ready, pending for now)
-- 5. interview_questions — generated or manual questions per analysis
-- 6. interview_answer_attempts — practice answers per question
-- ============================================

-- ============================================
-- 1. CREATE TABLES
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
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_answer_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES job_prep_projects(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_job_prep_projects_user_id ON job_prep_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_job_prep_projects_user_id_updated_at
    ON job_prep_projects(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_project_id ON resumes(project_id);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_project_id ON job_descriptions(project_id);

CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_user_id ON resume_job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_analyses_project_id ON resume_job_analyses(project_id);

CREATE INDEX IF NOT EXISTS idx_interview_questions_user_id ON interview_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_project_id ON interview_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_analysis_id ON interview_questions(analysis_id);

CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_user_id ON interview_answer_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_project_id ON interview_answer_attempts(project_id);
CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_question_id ON interview_answer_attempts(question_id);

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_job_prep_projects_updated_at
    BEFORE UPDATE ON job_prep_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_job_analyses_updated_at
    BEFORE UPDATE ON resume_job_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_questions_updated_at
    BEFORE UPDATE ON interview_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_answer_attempts_updated_at
    BEFORE UPDATE ON interview_answer_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE job_prep_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answer_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR job_prep_projects
-- ============================================

CREATE POLICY "Users can view own job prep projects"
    ON job_prep_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job prep projects"
    ON job_prep_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job prep projects"
    ON job_prep_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job prep projects"
    ON job_prep_projects FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. RLS POLICIES FOR resumes
-- ============================================

CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. RLS POLICIES FOR job_descriptions
-- ============================================

CREATE POLICY "Users can view own job descriptions"
    ON job_descriptions FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own job descriptions"
    ON job_descriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job descriptions"
    ON job_descriptions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 8. RLS POLICIES FOR resume_job_analyses
-- ============================================

CREATE POLICY "Users can view own resume job analyses"
    ON resume_job_analyses FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own resume job analyses"
    ON resume_job_analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume job analyses"
    ON resume_job_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 9. RLS POLICIES FOR interview_questions
-- ============================================

CREATE POLICY "Users can view own interview questions"
    ON interview_questions FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own interview questions"
    ON interview_questions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview questions"
    ON interview_questions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 10. RLS POLICIES FOR interview_answer_attempts
-- ============================================

CREATE POLICY "Users can view own interview answer attempts"
    ON interview_answer_attempts FOR SELECT
    USING (auth.uid() = user_id);

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
    );

CREATE POLICY "Users can update own interview answer attempts"
    ON interview_answer_attempts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview answer attempts"
    ON interview_answer_attempts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Migration complete!
-- ============================================

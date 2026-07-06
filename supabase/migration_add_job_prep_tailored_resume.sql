-- ============================================
-- Migration: Add tailored resume generation for Job Prep
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

CREATE INDEX IF NOT EXISTS idx_tailored_resume_generations_user_id
    ON tailored_resume_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resume_generations_project_id
    ON tailored_resume_generations(project_id);

CREATE TRIGGER update_tailored_resume_generations_updated_at
    BEFORE UPDATE ON tailored_resume_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tailored_resume_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tailored resume generations"
    ON tailored_resume_generations FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own tailored resume generations"
    ON tailored_resume_generations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tailored resume generations"
    ON tailored_resume_generations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Migration complete!
-- ============================================

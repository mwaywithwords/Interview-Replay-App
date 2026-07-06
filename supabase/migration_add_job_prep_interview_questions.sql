-- ============================================
-- Migration: Interview question generation for Job Prep
-- Extends interview_questions + adds generation tracking
-- ============================================

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
SET what_good_answer_should_include = ''
WHERE what_good_answer_should_include IS NULL;

ALTER TABLE interview_questions
    ALTER COLUMN question_type SET NOT NULL,
    ALTER COLUMN difficulty SET NOT NULL,
    ALTER COLUMN what_good_answer_should_include SET NOT NULL;

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

CREATE INDEX IF NOT EXISTS idx_interview_question_generations_user_id
    ON interview_question_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_question_generations_project_id
    ON interview_question_generations(project_id);

CREATE TRIGGER update_interview_question_generations_updated_at
    BEFORE UPDATE ON interview_question_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE interview_question_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview question generations"
    ON interview_question_generations FOR SELECT
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update own interview question generations"
    ON interview_question_generations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview question generations"
    ON interview_question_generations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Migration complete!
-- ============================================

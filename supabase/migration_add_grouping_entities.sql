-- ============================================
-- Migration: Add grouping entities (companies and symbols)
-- ============================================
-- This migration adds:
-- 1. companies table for organizing interview sessions
-- 2. symbols table for organizing trading sessions
-- 3. session_companies join table for many-to-many relationship
-- 4. session_symbols join table for many-to-many relationship
-- 5. RLS policies to ensure user isolation
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- --------------------------------------------
-- companies: Companies for organizing interview sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- symbols: Trading symbols for organizing trading sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- session_companies: Many-to-many relationship between sessions and companies
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, company_id)
);

-- --------------------------------------------
-- session_symbols: Many-to-many relationship between sessions and symbols
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    symbol_id UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, symbol_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id_name ON companies(user_id, name);

-- symbols indexes
CREATE INDEX IF NOT EXISTS idx_symbols_user_id ON symbols(user_id);
CREATE INDEX IF NOT EXISTS idx_symbols_user_id_ticker ON symbols(user_id, ticker);

-- session_companies indexes
CREATE INDEX IF NOT EXISTS idx_session_companies_user_id ON session_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_session_companies_session_id ON session_companies(session_id);
CREATE INDEX IF NOT EXISTS idx_session_companies_company_id ON session_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_session_companies_session_company ON session_companies(session_id, company_id);

-- session_symbols indexes
CREATE INDEX IF NOT EXISTS idx_session_symbols_user_id ON session_symbols(user_id);
CREATE INDEX IF NOT EXISTS idx_session_symbols_session_id ON session_symbols(session_id);
CREATE INDEX IF NOT EXISTS idx_session_symbols_symbol_id ON session_symbols(symbol_id);
CREATE INDEX IF NOT EXISTS idx_session_symbols_session_symbol ON session_symbols(session_id, symbol_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_symbols ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR companies
-- ============================================

-- Users can view their own companies
CREATE POLICY "Users can view own companies"
    ON companies FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies"
    ON companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies"
    ON companies FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies"
    ON companies FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. RLS POLICIES FOR symbols
-- ============================================

-- Users can view their own symbols
CREATE POLICY "Users can view own symbols"
    ON symbols FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own symbols
CREATE POLICY "Users can insert own symbols"
    ON symbols FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own symbols
CREATE POLICY "Users can update own symbols"
    ON symbols FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own symbols
CREATE POLICY "Users can delete own symbols"
    ON symbols FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. RLS POLICIES FOR session_companies
-- ============================================

-- Users can view their own session-company associations
CREATE POLICY "Users can view own session_companies"
    ON session_companies FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert session-company associations for their own sessions and companies
CREATE POLICY "Users can insert own session_companies"
    ON session_companies FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_companies.session_id
            AND sessions.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM companies
            WHERE companies.id = session_companies.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Users can update their own session-company associations
CREATE POLICY "Users can update own session_companies"
    ON session_companies FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own session-company associations
CREATE POLICY "Users can delete own session_companies"
    ON session_companies FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. RLS POLICIES FOR session_symbols
-- ============================================

-- Users can view their own session-symbol associations
CREATE POLICY "Users can view own session_symbols"
    ON session_symbols FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert session-symbol associations for their own sessions and symbols
CREATE POLICY "Users can insert own session_symbols"
    ON session_symbols FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_symbols.session_id
            AND sessions.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM symbols
            WHERE symbols.id = session_symbols.symbol_id
            AND symbols.user_id = auth.uid()
        )
    );

-- Users can update their own session-symbol associations
CREATE POLICY "Users can update own session_symbols"
    ON session_symbols FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own session-symbol associations
CREATE POLICY "Users can delete own session_symbols"
    ON session_symbols FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Migration complete!
-- ============================================

-- Supabase Database Schema for Quizmaster Application
-- This file documents the current structure, policies, and expected data shapes.

-- 1. EXTENSIONS
-- Required for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS quizzes (
  -- Primary Key & Metadata
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ownership
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_email  TEXT, -- Displayed publicly on quiz cards
  
  -- Content
  title          TEXT NOT NULL,
  description    TEXT,
  icon           TEXT DEFAULT '📝',
  color          TEXT DEFAULT 'from-zinc-500 to-zinc-700',
  
  -- JSON Data: Array of Question DTOs
  -- Format: [{ question: string, options: string[], correctAnswer: number, explanation: string }]
  questions      JSONB NOT NULL
);

-- 3. SECURITY (Row Level Security)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can see all quizzes (Public Access)
DROP POLICY IF EXISTS "Public Read Access" ON quizzes;
CREATE POLICY "Public Read Access" 
ON quizzes FOR SELECT 
USING (true);

-- Policy: Authenticated users can create quizzes
DROP POLICY IF EXISTS "Users can create quizzes" ON quizzes;
CREATE POLICY "Users can create quizzes" 
ON quizzes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own quizzes ("Update if exists" support)
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
CREATE POLICY "Users can update own quizzes" 
ON quizzes FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own quizzes
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;
CREATE POLICY "Users can delete own quizzes" 
ON quizzes FOR DELETE 
USING (auth.uid() = user_id);

/* 
  APPLICATION LOGIC NOTES:
  
  - UPDATE IF EXISTS: 
    The QuizCreator component checks for `initialData.id`. 
    If present, it performs a .update().eq('id', id) call.
    If absent, it performs a .insert() call.
    
  - ERROR HANDLING:
    - Validation is enforced via Zod (schemas.ts) before reaching DB.
    - Database permission errors (RLS) are caught and mapped to:
      "Permission Denied: You do not have permission to modify this quiz."
*/

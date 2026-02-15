-- MASTER SETUP SCRIPT
-- This script consolidates all gamification, profile, and quiz attempt logic.
-- It is designed to be idempotent (mostly) but will RESET the quiz_attempts table to ensure schema correctness.

-- ==========================================
-- 1. PROFILES & USERS
-- ==========================================

-- Create profiles table
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text,
  avatar_url text,
  total_xp integer default 0,
  current_league text default 'Bronze',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles Policies (Drop first to avoid errors)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Profile Trigger: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (id, username)
select 
  id,
  coalesce(
    raw_user_meta_data ->> 'username',
    raw_user_meta_data ->> 'name',
    split_part(email, '@', 1)
  )
from auth.users
where id not in (select id from public.profiles);


-- ==========================================
-- 2. QUIZZES TABLE ENHANCEMENTS & FIXES
-- ==========================================

alter table public.quizzes add column if not exists subject text;
create index if not exists idx_quizzes_subject on public.quizzes(subject);

-- Ensure Foreign Key relationship exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.quizzes 
        ADD CONSTRAINT quizzes_user_id_fkey_profiles 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id);
    END IF;
END $$;


-- ==========================================
-- 3. QUIZ ATTEMPTS & GAMIFICATION
-- ==========================================

-- Clean slate for attempts to fix any schema mismatches (UUID vs TEXT)
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(uuid, text, integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(text, text, integer, integer, jsonb);
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;

-- Re-create quiz_attempts table
-- Using TEXT for quiz_id to support both UUIDs (DB quizzes) and string IDs (Static quizzes)
create table public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quiz_id text not null, 
  quiz_title text,
  score integer default 0,
  total_questions integer default 0,
  answers jsonb default '[]'::jsonb,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quiz_attempts enable row level security;

-- Policies
create policy "Users can insert their own attempts"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

-- Indexes
create index idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index idx_quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);

-- RPC Function: Submit Quiz Attempt
-- Handles XP calculation, league updates, and prevents farming
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id text,
  p_quiz_title text,
  p_score integer,
  p_total_questions integer,
  p_answers jsonb
) 
RETURNS jsonb AS $$
DECLARE
  v_xp_gain integer;
  v_new_total_xp integer;
  v_new_league text;
  v_attempt_id uuid;
  v_already_perfected boolean;
BEGIN
  -- Check if user has already achieved a perfect score for this quiz
  -- Comparison is safe because quiz_id column is now TEXT
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE user_id = auth.uid()
    AND quiz_id = p_quiz_id
    AND score = total_questions
  ) INTO v_already_perfected;

  -- Calculate Potential XP
  v_xp_gain := (p_score * 10);
  IF p_score = p_total_questions THEN
    v_xp_gain := v_xp_gain + 50;
  END IF;

  -- If already perfected, cap XP gain to 0
  IF v_already_perfected THEN
    v_xp_gain := 0;
  END IF;

  -- Insert Attempt
  INSERT INTO public.quiz_attempts (
    user_id, quiz_id, quiz_title, score, total_questions, answers, completed_at
  ) VALUES (
    auth.uid(), p_quiz_id, p_quiz_title, p_score, p_total_questions, p_answers, now()
  ) RETURNING id INTO v_attempt_id;

  -- Update Profile XP (only if gained > 0)
  IF v_xp_gain > 0 THEN
    UPDATE public.profiles
    SET 
      total_xp = total_xp + v_xp_gain,
      updated_at = now()
    WHERE id = auth.uid()
    RETURNING total_xp INTO v_new_total_xp;
  ELSE
    SELECT total_xp INTO v_new_total_xp FROM public.profiles WHERE id = auth.uid();
  END IF;

  -- Determine League
  v_new_league := CASE
    WHEN v_new_total_xp >= 1000 THEN 'Gold'
    WHEN v_new_total_xp >= 500 THEN 'Silver'
    ELSE 'Bronze'
  END;

  -- Update League if changed
  UPDATE public.profiles
  SET current_league = v_new_league
  WHERE id = auth.uid() AND current_league != v_new_league;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'xp_gained', v_xp_gain,
    'new_total_xp', v_new_total_xp,
    'new_league', v_new_league,
    'already_perfected', v_already_perfected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. UTILITY FUNCTIONS
-- ==========================================

-- RPC: Clear User History
-- Deletes all quiz attempts and resets XP/League for the authenticated user
CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS void AS $$
BEGIN
  -- 1. Delete all attempts for the user
  DELETE FROM public.quiz_attempts
  WHERE user_id = auth.uid();

  -- 2. Reset Profile Stats
  UPDATE public.profiles
  SET 
    total_xp = 0,
    current_league = 'Bronze',
    updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. UTILITY FUNCTIONS
-- ==========================================

-- RPC: Clear User History
-- Deletes all quiz attempts and resets XP/League for the authenticated user
CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS void AS $$
BEGIN
  -- 1. Delete all attempts for the user
  DELETE FROM public.quiz_attempts
  WHERE user_id = auth.uid();

  -- 2. Reset Profile Stats
  UPDATE public.profiles
  SET 
    total_xp = 0,
    current_league = 'Bronze',
    updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

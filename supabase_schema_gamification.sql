-- 1. PROFILES TABLE (User stats & details)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  total_xp integer DEFAULT 0,
  current_league text DEFAULT 'Bronze',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. UPDATES to QUIZZES TABLE
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject text;
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);

-- 4. RPC: Submit Quiz Attempt (Atomic XP Update)
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id uuid,
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
BEGIN
  -- Calculate XP (Example: 10 XP per correct answer, bonus 50 for perfect score)
  v_xp_gain := (p_score * 10);
  IF p_score = p_total_questions THEN
    v_xp_gain := v_xp_gain + 50;
  END IF;

  -- Insert Attempt
  INSERT INTO public.quiz_attempts (
    user_id, quiz_id, quiz_title, score, total_questions, answers, completed_at
  ) VALUES (
    auth.uid(), p_quiz_id, p_quiz_title, p_score, p_total_questions, p_answers, now()
  ) RETURNING id INTO v_attempt_id;

  -- Update Profile XP
  UPDATE public.profiles
  SET 
    total_xp = total_xp + v_xp_gain,
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING total_xp INTO v_new_total_xp;

  -- Determine League (Simple Logic)
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
    'new_league', v_new_league
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

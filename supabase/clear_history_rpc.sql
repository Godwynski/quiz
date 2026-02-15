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

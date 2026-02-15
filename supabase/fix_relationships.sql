-- 1. Ensure sure all quiz creators have a profile entry
-- This prevents the Foreign Key constraint from failing if a user exists in quizzes but not profiles
INSERT INTO public.profiles (id)
SELECT DISTINCT user_id FROM public.quizzes
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Add the Foreign Key constraint
-- This explicitly tells PostgREST that quizzes.user_id points to profiles.id
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

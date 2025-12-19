-- Add player_answers column to store text responses for remote play
ALTER TABLE public.truth_or_dare_sessions 
ADD COLUMN IF NOT EXISTS player_answers jsonb DEFAULT '{}'::jsonb;
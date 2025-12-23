-- Add columns for structured transcript and AI analysis to voice_sessions
ALTER TABLE public.voice_sessions
ADD COLUMN IF NOT EXISTS structured_transcript jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS ai_notes text[],
ADD COLUMN IF NOT EXISTS ai_recommendations text[];
-- Add transcript column to voice_sessions for download capability
ALTER TABLE public.voice_sessions 
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS luna_transcript text;
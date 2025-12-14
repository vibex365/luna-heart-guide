-- Add missing columns for segment-specific content
ALTER TABLE public.dm_segments 
ADD COLUMN IF NOT EXISTS relatability_tagline text,
ADD COLUMN IF NOT EXISTS hero_icon text DEFAULT 'heart',
ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb;
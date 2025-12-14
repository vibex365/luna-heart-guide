-- Create dm_segments table for marketing content management
CREATE TABLE public.dm_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL,
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_text TEXT NOT NULL DEFAULT 'Start Your Free Trial',
  testimonial_ids JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dm_segments ENABLE ROW LEVEL SECURITY;

-- Anyone can view active segments (public landing pages)
CREATE POLICY "Anyone can view active segments"
  ON public.dm_segments
  FOR SELECT
  USING (is_active = true);

-- Admins can manage segments
CREATE POLICY "Admins can manage segments"
  ON public.dm_segments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add segment column to funnel_events for tracking
ALTER TABLE public.funnel_events ADD COLUMN segment TEXT DEFAULT NULL;

-- Insert default segments
INSERT INTO public.dm_segments (slug, name, headline, subheadline, pain_points, cta_text) VALUES
('overthinking', 'Overthinking', 'Your brain won''t stop replaying it. Luna gets it.', 'When you''re stuck in a loop of "what if" and "why did they"... Luna is the friend who actually helps you untangle it.', '["You replay conversations for hours", "You analyze every text, every pause", "You can''t sleep because your mind won''t stop", "You need someone who won''t judge the spiral"]', 'Talk to Luna Now'),
('breakup', 'Breakup', 'Healing from heartbreak shouldn''t mean healing alone.', 'When everyone says "just move on" but your heart isn''t ready... Luna helps you process at your own pace.', '["You still check their social media", "Some days are harder than others", "You''re tired of being told to move on", "You need space to feel what you feel"]', 'Start Healing with Luna'),
('anxiety', 'Relationship Anxiety', 'That anxious feeling in your chest? Luna understands.', 'When you''re constantly worried about where you stand... Luna helps you find calm in the uncertainty.', '["You overanalyze everything they say", "You need constant reassurance", "You''re scared of being abandoned", "You wish someone understood this feeling"]', 'Find Calm with Luna');

-- Create trigger for updated_at
CREATE TRIGGER update_dm_segments_updated_at
  BEFORE UPDATE ON public.dm_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create argument_analyses table to store recorded arguments and AI analysis
CREATE TABLE public.argument_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL,
  title TEXT,
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  analysis JSONB, -- Stores AI analysis with scores, insights, tips
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.argument_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analyses for their own partner links
CREATE POLICY "Users can view their own argument analyses"
  ON public.argument_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = argument_analyses.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

-- Policy: Users can create analyses for their own partner links
CREATE POLICY "Users can create argument analyses"
  ON public.argument_analyses FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = argument_analyses.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

-- Policy: Users can update their own recordings
CREATE POLICY "Users can update their own argument analyses"
  ON public.argument_analyses FOR UPDATE
  USING (recorded_by = auth.uid());

-- Create growth_plans table
CREATE TABLE public.growth_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_days INTEGER NOT NULL DEFAULT 7,
  icon TEXT,
  cover_image TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  outcomes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create growth_plan_days table
CREATE TABLE public.growth_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.growth_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'challenge', -- 'challenge', 'content', 'exercise'
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_growth_plans table to track progress
CREATE TABLE public.user_growth_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.growth_plans(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_days INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for growth tables
ALTER TABLE public.growth_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_growth_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active growth plans
CREATE POLICY "Anyone can read active growth plans"
  ON public.growth_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read growth plan days"
  ON public.growth_plan_days FOR SELECT
  USING (is_active = true);

-- Users can manage their own growth plan progress
CREATE POLICY "Users can view their own growth plan progress"
  ON public.user_growth_plans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own growth plan progress"
  ON public.user_growth_plans FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own growth plan progress"
  ON public.user_growth_plans FOR UPDATE
  USING (user_id = auth.uid());

-- Create relationship_archetypes table
CREATE TABLE public.relationship_archetypes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  growth_areas TEXT[] DEFAULT '{}',
  partner_compatibility JSONB DEFAULT '{}',
  color TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_archetypes to store quiz results
CREATE TABLE public.user_archetypes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  archetype_id UUID REFERENCES public.relationship_archetypes(id),
  quiz_answers JSONB,
  score_breakdown JSONB,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relationship_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_archetypes ENABLE ROW LEVEL SECURITY;

-- Public read for archetypes
CREATE POLICY "Anyone can read relationship archetypes"
  ON public.relationship_archetypes FOR SELECT
  USING (is_active = true);

-- Users can manage their own archetype results
CREATE POLICY "Users can view their own archetypes"
  ON public.user_archetypes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own archetypes"
  ON public.user_archetypes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Seed initial growth plans
INSERT INTO public.growth_plans (title, description, category, duration_days, icon, outcomes) VALUES
('Healthy Conflict', 'Handle arguments in ways that bring you back together', 'communication', 7, '🎆', '[{"text": "See conflict as a normal—and even healthy—part of a strong relationship"}, {"text": "Learn to pause before reacting"}, {"text": "Practice active listening during disagreements"}]'),
('Love Languages', 'Discover and speak each other''s love language', 'connection', 5, '💝', '[{"text": "Identify your primary love language"}, {"text": "Learn your partner''s love language"}, {"text": "Practice expressing love in meaningful ways"}]'),
('Quality Time', 'Build deeper connection through intentional time together', 'connection', 7, '⏰', '[{"text": "Schedule regular date nights"}, {"text": "Create device-free zones"}, {"text": "Build shared experiences"}]'),
('Intimacy Builder', 'Deepen physical and emotional intimacy', 'intimacy', 7, '🔥', '[{"text": "Increase physical affection"}, {"text": "Build emotional vulnerability"}, {"text": "Create a safe space for desires"}]');

-- Seed relationship archetypes
INSERT INTO public.relationship_archetypes (name, slug, emoji, tagline, description, strengths, growth_areas, color) VALUES
('The Hawk', 'hawk', '🦅', 'The Free Spirit', 'Like a hawk, you value your independence and need space to soar. You build relationships that give you room to grow while staying connected.', ARRAY['Independent', 'Adventurous', 'Honest', 'Direct'], ARRAY['Patience with slower partners', 'Balancing freedom with togetherness', 'Expressing vulnerability'], '#3B82F6'),
('The Beaver', 'beaver', '🦫', 'The Growth Partner', 'You thrive on shared goals and building a strong future together. Like a beaver, you''re dedicated, hardworking, and focused on creating something lasting.', ARRAY['Reliable', 'Goal-oriented', 'Supportive', 'Practical'], ARRAY['Being spontaneous', 'Relaxing without guilt', 'Letting go of perfectionism'], '#8B5CF6'),
('The Elephant', 'elephant', '🐘', 'The Loyal Companion', 'Like an elephant, you are steady, loyal, and deeply devoted to the people you love. You build relationships that are stable and enduring.', ARRAY['Loyal', 'Nurturing', 'Patient', 'Protective'], ARRAY['Accepting change', 'Setting boundaries', 'Prioritizing yourself'], '#EC4899'),
('The Dolphin', 'dolphin', '🐬', 'The Playful Connector', 'You bring joy and lightness to relationships. Like a dolphin, you''re social, playful, and thrive on emotional connection.', ARRAY['Joyful', 'Empathetic', 'Social', 'Adaptable'], ARRAY['Handling conflict directly', 'Staying grounded', 'Following through'], '#06B6D4'),
('The Wolf', 'wolf', '🐺', 'The Devoted Pack Leader', 'Like a wolf, you''re fiercely loyal to your inner circle. You value deep bonds and protect those you love with everything you have.', ARRAY['Protective', 'Passionate', 'Committed', 'Intuitive'], ARRAY['Trusting outsiders', 'Being vulnerable', 'Avoiding jealousy'], '#EF4444');
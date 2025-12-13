-- Create table for love language quiz results
CREATE TABLE public.love_language_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  primary_language TEXT NOT NULL,
  secondary_language TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for daily challenges
CREATE TABLE public.couples_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'connection',
  difficulty TEXT DEFAULT 'easy',
  duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for completed challenges
CREATE TABLE public.completed_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.couples_challenges(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE public.love_language_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- Policies for love_language_results
CREATE POLICY "Partners can view their love language results"
  ON public.love_language_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = love_language_results.partner_link_id
        AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
        AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own results"
  ON public.love_language_results
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = love_language_results.partner_link_id
        AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
        AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own results"
  ON public.love_language_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for couples_challenges
CREATE POLICY "Anyone can view active challenges"
  ON public.couples_challenges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON public.couples_challenges
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policies for completed_challenges
CREATE POLICY "Partners can view completed challenges"
  ON public.completed_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = completed_challenges.partner_link_id
        AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
        AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Users can complete challenges"
  ON public.completed_challenges
  FOR INSERT
  WITH CHECK (
    auth.uid() = completed_by
    AND EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = completed_challenges.partner_link_id
        AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
        AND pl.status = 'accepted'
    )
  );
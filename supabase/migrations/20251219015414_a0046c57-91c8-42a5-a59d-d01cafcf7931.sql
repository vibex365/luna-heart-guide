-- Create couples_game_questions table for CMS-managed game content
CREATE TABLE public.couples_game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL, -- 'this_or_that', 'would_you_rather', 'truth_or_dare', 'never_have_i_ever', 'conversation_starters'
  question_text TEXT NOT NULL,
  option_a TEXT, -- for this_or_that, would_you_rather
  option_b TEXT, -- for this_or_that, would_you_rather  
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'regular', -- 'regular', 'spicy', 'intimate'
  depth INTEGER DEFAULT 1, -- 1-3 for conversation depth
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for efficient querying
CREATE INDEX idx_couples_game_questions_type ON public.couples_game_questions(game_type);
CREATE INDEX idx_couples_game_questions_active ON public.couples_game_questions(is_active);

-- Enable RLS
ALTER TABLE public.couples_game_questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all questions
CREATE POLICY "Admins can manage couples game questions"
ON public.couples_game_questions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view active questions
CREATE POLICY "Authenticated users can view active questions"
ON public.couples_game_questions
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_couples_game_questions_updated_at
BEFORE UPDATE ON public.couples_game_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
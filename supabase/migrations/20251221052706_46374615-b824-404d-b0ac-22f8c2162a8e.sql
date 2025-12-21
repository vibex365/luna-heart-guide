-- Create journal prompts table for couples
CREATE TABLE public.couples_journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'reflection',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create couples journal entries table
CREATE TABLE public.couples_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prompt_id UUID REFERENCES couples_journal_prompts(id),
  content TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT true,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.couples_journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_journal_entries ENABLE ROW LEVEL SECURITY;

-- Policies for journal prompts (read-only for users, admin can manage)
CREATE POLICY "Anyone can view active journal prompts"
ON public.couples_journal_prompts FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage journal prompts"
ON public.couples_journal_prompts FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policies for journal entries
CREATE POLICY "Users can insert their own entries"
ON public.couples_journal_entries FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_journal_entries.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can view shared entries"
ON public.couples_journal_entries FOR SELECT
USING (
  user_id = auth.uid() OR
  (is_shared = true AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_journal_entries.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  ))
);

CREATE POLICY "Users can update their own entries"
ON public.couples_journal_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
ON public.couples_journal_entries FOR DELETE
USING (auth.uid() = user_id);

-- Seed some journal prompts
INSERT INTO public.couples_journal_prompts (prompt_text, category, sort_order) VALUES
('What made you fall in love with your partner?', 'love', 1),
('Describe your happiest memory together.', 'memories', 2),
('What''s one thing your partner does that makes you feel special?', 'appreciation', 3),
('What goals do you want to achieve together this year?', 'goals', 4),
('What''s something new you''d like to try with your partner?', 'adventure', 5),
('How has your relationship grown over time?', 'growth', 6),
('What''s your favorite thing about your daily routine together?', 'daily', 7),
('Describe a challenge you overcame as a couple.', 'growth', 8),
('What would your perfect day together look like?', 'dreams', 9),
('What are you most grateful for about your partner today?', 'gratitude', 10),
('What''s a dream vacation you''d like to take together?', 'dreams', 11),
('How do you want to celebrate your next anniversary?', 'celebration', 12),
('What''s something your partner taught you?', 'growth', 13),
('Describe a moment when you felt truly understood.', 'connection', 14),
('What traditions would you like to create together?', 'future', 15);
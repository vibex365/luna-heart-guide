-- Daily questions catalog
CREATE TABLE public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT DEFAULT 'easy',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily question answers from partners
CREATE TABLE public.daily_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer_text TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now(),
  question_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(partner_link_id, question_id, user_id, question_date)
);

-- Expert relationship tips
CREATE TABLE public.relationship_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  author TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User virtual currency balance
CREATE TABLE public.user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coin transaction history
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Daily questions policies (anyone can view active)
CREATE POLICY "Anyone can view active daily questions"
ON public.daily_questions FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage daily questions"
ON public.daily_questions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Daily question answers policies
CREATE POLICY "Partners can view their answers"
ON public.daily_question_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = daily_question_answers.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Users can insert their own answers"
ON public.daily_question_answers FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = daily_question_answers.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Relationship tips policies
CREATE POLICY "Anyone can view active tips"
ON public.relationship_tips FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tips"
ON public.relationship_tips FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- User coins policies
CREATE POLICY "Users can view their own coins"
ON public.user_coins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coins"
ON public.user_coins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins"
ON public.user_coins FOR UPDATE
USING (auth.uid() = user_id);

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.coin_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Seed some initial daily questions
INSERT INTO public.daily_questions (question_text, category, difficulty) VALUES
('What''s one thing your partner did recently that made you smile?', 'appreciation', 'easy'),
('If you could travel anywhere together tomorrow, where would you go?', 'dreams', 'easy'),
('What''s a childhood memory you haven''t shared with your partner yet?', 'memories', 'medium'),
('How do you feel most loved by your partner?', 'love', 'easy'),
('What''s something you admire about your partner that you don''t say enough?', 'appreciation', 'medium'),
('If you had 24 hours with no responsibilities, how would you spend it together?', 'fun', 'easy'),
('What''s a goal you''d like to achieve together this year?', 'growth', 'medium'),
('What song reminds you of your relationship?', 'memories', 'easy'),
('What''s something new you''d like to try together?', 'adventure', 'easy'),
('When did you first realize you were in love with your partner?', 'love', 'medium'),
('What''s your partner''s love language, and how can you speak it more?', 'love', 'medium'),
('What''s a small gesture your partner does that means the world to you?', 'appreciation', 'easy'),
('What''s one thing you want your partner to know but haven''t told them?', 'deep', 'hard'),
('How has your partner helped you grow as a person?', 'growth', 'medium'),
('What''s your favorite memory from the first year of your relationship?', 'memories', 'easy');

-- Seed some relationship tips
INSERT INTO public.relationship_tips (title, content, category, author) VALUES
('The Power of Daily Check-ins', 'Taking just 5 minutes each day to ask "How are you really doing?" can transform your relationship. It shows your partner they matter and creates space for honest communication.', 'communication', 'Dr. John Gottman'),
('Practice the 5:1 Ratio', 'Research shows that happy couples have at least 5 positive interactions for every negative one. Focus on expressing gratitude, affection, and appreciation daily.', 'positivity', 'Dr. John Gottman'),
('Listen to Understand, Not to Reply', 'When your partner is speaking, focus on truly understanding their perspective rather than formulating your response. Repeat back what you heard to ensure clarity.', 'communication', 'Dr. Sue Johnson'),
('Create Rituals of Connection', 'Whether it''s a morning coffee together or a nightly walk, small rituals create a sense of security and togetherness that strengthens your bond.', 'connection', 'Dr. Gary Chapman'),
('Embrace Vulnerability', 'Sharing your fears, dreams, and insecurities creates deeper intimacy. Vulnerability is the birthplace of love, belonging, and trust.', 'intimacy', 'Brené Brown'),
('Celebrate Small Wins Together', 'Don''t wait for big achievements. Celebrate the small victories in each other''s lives to build a culture of support and encouragement.', 'appreciation', 'Dr. Shelly Gable'),
('Give Your Full Attention', 'When spending quality time together, put away devices and be fully present. Your undivided attention is one of the greatest gifts you can give.', 'quality-time', 'Dr. Gary Chapman'),
('Apologize Without "But"', 'A genuine apology doesn''t include justifications. Simply acknowledge the hurt, express remorse, and commit to doing better.', 'conflict', 'Dr. Harriet Lerner');
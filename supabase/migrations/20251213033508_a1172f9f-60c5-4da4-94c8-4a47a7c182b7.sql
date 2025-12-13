-- Partner links table for connecting two users
CREATE TABLE public.partner_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code text UNIQUE NOT NULL,
  invite_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Relationship health scores
CREATE TABLE public.relationship_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id uuid NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  communication_score integer DEFAULT 50 CHECK (communication_score >= 0 AND communication_score <= 100),
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  intimacy_score integer DEFAULT 50 CHECK (intimacy_score >= 0 AND intimacy_score <= 100),
  conflict_resolution_score integer DEFAULT 50 CHECK (conflict_resolution_score >= 0 AND conflict_resolution_score <= 100),
  overall_score integer GENERATED ALWAYS AS (
    (communication_score + trust_score + intimacy_score + conflict_resolution_score) / 4
  ) STORED,
  last_assessment_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shared mood entries between partners
CREATE TABLE public.shared_mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id uuid NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_level integer NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  mood_label text NOT NULL,
  notes text,
  is_visible_to_partner boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Conflict resolution templates for Luna
CREATE TABLE public.conflict_resolution_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  trigger_phrases text[] DEFAULT '{}',
  script_template text NOT NULL,
  follow_up_questions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shared activities for couples
CREATE TABLE public.shared_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'connection',
  duration_minutes integer DEFAULT 30,
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'challenging')),
  instructions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Track completed activities
CREATE TABLE public.completed_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id uuid NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.shared_activities(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_rating integer CHECK (partner_rating >= 1 AND partner_rating <= 5),
  notes text,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolution_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_activities ENABLE ROW LEVEL SECURITY;

-- Partner links policies
CREATE POLICY "Users can view their own partner links"
ON public.partner_links FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create partner links"
ON public.partner_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their partner links"
ON public.partner_links FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can delete their own partner links"
ON public.partner_links FOR DELETE
USING (auth.uid() = user_id);

-- Relationship health scores policies
CREATE POLICY "Partners can view their health scores"
ON public.relationship_health_scores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partner_links pl
  WHERE pl.id = partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can update health scores"
ON public.relationship_health_scores FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.partner_links pl
  WHERE pl.id = partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

-- Shared mood entries policies
CREATE POLICY "Partners can view shared moods"
ON public.shared_mood_entries FOR SELECT
USING (
  user_id = auth.uid() OR 
  (is_visible_to_partner = true AND EXISTS (
    SELECT 1 FROM public.partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  ))
);

CREATE POLICY "Users can create shared mood entries"
ON public.shared_mood_entries FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Conflict resolution templates - public read
CREATE POLICY "Anyone can view active templates"
ON public.conflict_resolution_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.conflict_resolution_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Shared activities - public read
CREATE POLICY "Anyone can view active activities"
ON public.shared_activities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage activities"
ON public.shared_activities FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Completed activities policies
CREATE POLICY "Partners can view completed activities"
ON public.completed_activities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partner_links pl
  WHERE pl.id = partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Users can create completed activities"
ON public.completed_activities FOR INSERT
WITH CHECK (
  auth.uid() = completed_by AND EXISTS (
    SELECT 1 FROM public.partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger for health scores on partner link accept
CREATE OR REPLACE FUNCTION create_health_score_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.relationship_health_scores (partner_link_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partner_link_accepted
  AFTER UPDATE ON public.partner_links
  FOR EACH ROW
  EXECUTE FUNCTION create_health_score_on_accept();

-- Insert default conflict resolution templates
INSERT INTO public.conflict_resolution_templates (title, category, trigger_phrases, script_template, follow_up_questions) VALUES
('Active Listening Exercise', 'communication', ARRAY['not listening', 'doesn''t hear me', 'ignores me'], 
'I understand you''re feeling unheard. Let''s try an active listening exercise: Take turns speaking for 2 minutes each while the other listens without interrupting. After each turn, the listener summarizes what they heard.',
ARRAY['How did it feel to be fully listened to?', 'What did you learn about your partner''s perspective?']),

('Cool Down Protocol', 'conflict', ARRAY['angry', 'fighting', 'argument', 'heated'],
'When emotions run high, it''s okay to take a break. I suggest a 20-minute cool-down period where you both do something calming separately. Then return to discuss the issue with fresh perspectives.',
ARRAY['What helped you calm down?', 'Are you ready to discuss this calmly now?']),

('Needs Expression', 'intimacy', ARRAY['needs not met', 'want more', 'feeling neglected'],
'It sounds like some needs aren''t being met. Try using "I feel... when... because I need..." statements to express your needs without blame.',
ARRAY['What specific need would you like to focus on?', 'How can your partner help meet this need?']),

('Appreciation Practice', 'connection', ARRAY['taken for granted', 'unappreciated', 'thankless'],
'Feeling appreciated is vital. Let''s start an appreciation practice: Each of you share 3 specific things you appreciate about your partner from the past week.',
ARRAY['How did it feel to hear those appreciations?', 'Would you like to make this a daily practice?']);

-- Insert default shared activities
INSERT INTO public.shared_activities (title, description, category, duration_minutes, difficulty, instructions) VALUES
('Daily Check-In', 'A quick daily connection ritual to stay in sync with your partner', 'connection', 10, 'easy',
'["Find a quiet moment together", "Each person shares: one high, one low, and one thing you''re grateful for about your partner", "Listen without interrupting", "End with a hug or physical touch"]'::jsonb),

('Dream Sharing', 'Share your hopes and dreams for the future together', 'intimacy', 30, 'medium',
'["Find a comfortable, private space", "Take turns sharing a dream or goal you have", "Ask curious questions about each other''s dreams", "Discuss how you can support each other''s goals"]'::jsonb),

('Conflict Replay', 'Revisit a past conflict with new understanding', 'conflict', 45, 'challenging',
'["Choose a past disagreement that''s been resolved", "Each person shares their perspective from that time", "Identify what each of you could have done differently", "Celebrate how you''ve grown since then"]'::jsonb),

('Love Language Discovery', 'Learn and practice each other''s love languages', 'connection', 20, 'easy',
'["Discuss the 5 love languages: Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch", "Each person identifies their top 2 love languages", "Share specific examples of how you like to receive love", "Commit to one action this week in your partner''s love language"]'::jsonb);
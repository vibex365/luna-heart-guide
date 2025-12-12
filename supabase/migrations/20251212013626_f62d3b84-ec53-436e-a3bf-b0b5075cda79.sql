-- Create breathing exercises table
CREATE TABLE public.breathing_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_seconds integer NOT NULL DEFAULT 60,
  inhale_seconds integer NOT NULL DEFAULT 4,
  hold_seconds integer NOT NULL DEFAULT 4,
  exhale_seconds integer NOT NULL DEFAULT 4,
  cycles integer NOT NULL DEFAULT 4,
  difficulty text DEFAULT 'beginner',
  category text DEFAULT 'relaxation',
  is_active boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mood prompts table
CREATE TABLE public.mood_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL,
  mood_category text,
  is_active boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create journal templates table
CREATE TABLE public.journal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  prompts jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  is_premium boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breathing_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

-- Public read for active content
CREATE POLICY "Anyone can view active breathing exercises"
ON public.breathing_exercises FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active mood prompts"
ON public.mood_prompts FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active journal templates"
ON public.journal_templates FOR SELECT USING (is_active = true);

-- Admin management policies
CREATE POLICY "Admins can manage breathing exercises"
ON public.breathing_exercises FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage mood prompts"
ON public.mood_prompts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage journal templates"
ON public.journal_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_breathing_exercises_updated_at
BEFORE UPDATE ON public.breathing_exercises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mood_prompts_updated_at
BEFORE UPDATE ON public.mood_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_templates_updated_at
BEFORE UPDATE ON public.journal_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.breathing_exercises (title, description, inhale_seconds, hold_seconds, exhale_seconds, cycles, category, difficulty) VALUES
('Box Breathing', 'A calming technique used by Navy SEALs', 4, 4, 4, 4, 'relaxation', 'beginner'),
('4-7-8 Sleep Breath', 'Helps promote sleep and reduce anxiety', 4, 7, 8, 4, 'sleep', 'intermediate'),
('Energizing Breath', 'Quick breaths to boost energy', 2, 0, 2, 10, 'energy', 'beginner');

INSERT INTO public.mood_prompts (prompt_text, mood_category) VALUES
('What made you smile today?', 'positive'),
('What''s weighing on your mind right now?', 'anxious'),
('Describe one thing you''re grateful for', 'neutral'),
('What would make today better?', 'sad'),
('What accomplishment are you proud of?', 'positive');

INSERT INTO public.journal_templates (title, description, prompts, category) VALUES
('Daily Reflection', 'End your day with mindful reflection', '["What went well today?", "What could have gone better?", "What will I focus on tomorrow?"]'::jsonb, 'daily'),
('Gratitude Journal', 'Focus on the positive aspects of life', '["List 3 things you''re grateful for", "Who made a positive impact today?", "What simple pleasure did you enjoy?"]'::jsonb, 'gratitude'),
('Anxiety Release', 'Process anxious thoughts constructively', '["What am I worried about?", "What can I control?", "What would I tell a friend in this situation?"]'::jsonb, 'anxiety');
-- Create scheduled SMS table
CREATE TABLE public.scheduled_sms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_type TEXT NOT NULL DEFAULT 'single',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.scheduled_sms ENABLE ROW LEVEL SECURITY;

-- Admins can manage scheduled SMS
CREATE POLICY "Admins can manage scheduled SMS" ON public.scheduled_sms
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for pending messages
CREATE INDEX idx_scheduled_sms_pending ON public.scheduled_sms (scheduled_at, status) WHERE status = 'pending';

-- Create daily affirmations config table
CREATE TABLE public.daily_affirmation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  account_type TEXT NOT NULL DEFAULT 'personal',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_affirmation_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage affirmation templates" ON public.daily_affirmation_templates
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active templates
CREATE POLICY "Anyone can view active affirmation templates" ON public.daily_affirmation_templates
FOR SELECT USING (is_active = true);

-- Insert some default affirmation templates
INSERT INTO public.daily_affirmation_templates (message, category, account_type) VALUES
-- Personal affirmations
('Good morning! Remember, every day is a fresh start. You have the power to make today amazing. 🌟', 'motivation', 'personal'),
('You are stronger than you think. Whatever challenges come your way today, you''ve got this! 💪', 'strength', 'personal'),
('Take a deep breath. You are worthy of love, peace, and happiness. Have a beautiful day! ✨', 'self-love', 'personal'),
('Your feelings are valid. It''s okay to not be okay sometimes. Luna is here for you whenever you need to talk. 💜', 'support', 'personal'),
('Small steps lead to big changes. Be proud of how far you''ve come! 🚶‍♀️✨', 'progress', 'personal'),

-- Couples affirmations
('Good morning, lovebirds! 💕 Take a moment today to appreciate something special about your partner.', 'appreciation', 'couples'),
('Love grows stronger with every shared moment. Plan something special together today! 💑', 'connection', 'couples'),
('Remember why you fell in love. Share one thing you''re grateful for about each other today. 💝', 'gratitude', 'couples'),
('Communication is the heartbeat of love. Check in with each other today – how are you really feeling? 💬', 'communication', 'couples'),
('Your relationship is a journey, not a destination. Enjoy every step together! 🌈💕', 'journey', 'couples');

-- Add trigger for updated_at
CREATE TRIGGER update_daily_affirmation_templates_updated_at
  BEFORE UPDATE ON public.daily_affirmation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
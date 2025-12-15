-- Create table for SMS templates
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for SMS delivery logs
CREATE TABLE public.sms_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates (admin only)
CREATE POLICY "Admins can manage SMS templates"
ON public.sms_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for sms_delivery_logs (admin only)
CREATE POLICY "Admins can view SMS delivery logs"
ON public.sms_delivery_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert SMS delivery logs"
ON public.sms_delivery_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_sms_templates_category ON public.sms_templates(category);
CREATE INDEX idx_sms_delivery_logs_sent_at ON public.sms_delivery_logs(sent_at DESC);
CREATE INDEX idx_sms_delivery_logs_user_id ON public.sms_delivery_logs(user_id);
CREATE INDEX idx_sms_delivery_logs_status ON public.sms_delivery_logs(status);

-- Add trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default templates
INSERT INTO public.sms_templates (name, message, category) VALUES
  ('Welcome', 'Welcome to Luna! We''re excited to have you on your wellness journey. 💜', 'onboarding'),
  ('Check-in Reminder', 'Hey! Just a friendly reminder to check in with Luna today. How are you feeling? 🌟', 'reminder'),
  ('Subscription Expiring', 'Your Luna subscription expires soon. Renew now to keep your unlimited access! 💫', 'subscription'),
  ('New Feature', 'Exciting news! We''ve added new features to Luna. Open the app to explore! ✨', 'announcement'),
  ('Couples Activity', 'Time for a couples activity! Open Luna with your partner for today''s challenge. 💕', 'couples');
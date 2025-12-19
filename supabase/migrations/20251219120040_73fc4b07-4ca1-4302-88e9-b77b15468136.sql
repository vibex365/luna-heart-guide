-- Create couples_trials table for tracking limited-time trial access
CREATE TABLE public.couples_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  converted_at TIMESTAMP WITH TIME ZONE,
  features_used JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.couples_trials ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial
CREATE POLICY "Users can view own trial" ON public.couples_trials
  FOR SELECT USING (auth.uid() = user_id);

-- Users can start a trial (insert)
CREATE POLICY "Users can start trial" ON public.couples_trials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trial
CREATE POLICY "Users can update own trial" ON public.couples_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_couples_trials_user_id ON public.couples_trials(user_id);
CREATE INDEX idx_couples_trials_status ON public.couples_trials(status);
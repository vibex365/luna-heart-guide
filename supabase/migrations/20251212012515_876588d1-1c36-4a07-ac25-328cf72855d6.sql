-- Add suspended fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN suspended boolean DEFAULT false,
ADD COLUMN suspended_at timestamptz,
ADD COLUMN suspended_reason text;

-- Create index for faster suspended user queries
CREATE INDEX idx_profiles_suspended ON public.profiles(suspended);
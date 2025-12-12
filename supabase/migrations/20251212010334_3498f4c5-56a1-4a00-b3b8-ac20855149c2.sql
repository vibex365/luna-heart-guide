-- Add weekly insights toggle column to profiles
ALTER TABLE public.profiles 
ADD COLUMN weekly_insights_enabled boolean DEFAULT true;
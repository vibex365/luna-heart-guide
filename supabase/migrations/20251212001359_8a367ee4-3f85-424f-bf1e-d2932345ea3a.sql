-- Add reminder settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN reminder_time TIME DEFAULT '09:00:00';
-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text;

-- Add check constraint for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_gender_check 
CHECK (gender IS NULL OR gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));
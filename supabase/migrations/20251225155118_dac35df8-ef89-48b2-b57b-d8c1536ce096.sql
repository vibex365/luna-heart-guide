-- Add column to track when subscription bonus minutes were last granted
ALTER TABLE public.user_minutes 
ADD COLUMN IF NOT EXISTS last_subscription_grant timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.user_minutes.last_subscription_grant IS 'Tracks when subscription bonus minutes were last granted to prevent double-granting within billing period';
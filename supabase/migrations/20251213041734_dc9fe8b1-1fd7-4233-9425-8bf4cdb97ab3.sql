-- Add source column to track subscription origin
ALTER TABLE public.user_subscriptions 
ADD COLUMN source text NOT NULL DEFAULT 'admin';

-- Add a comment for clarity
COMMENT ON COLUMN public.user_subscriptions.source IS 'Source of subscription: stripe, admin, or system';
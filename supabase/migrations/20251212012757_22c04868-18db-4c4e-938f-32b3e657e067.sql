-- Create subscription tiers table
CREATE TABLE public.subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier_id uuid REFERENCES public.subscription_tiers(id) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription tiers are publicly readable
CREATE POLICY "Anyone can view active subscription tiers"
ON public.subscription_tiers
FOR SELECT
USING (is_active = true);

-- Admins can manage tiers via security definer functions
CREATE POLICY "Admins can manage subscription tiers"
ON public.subscription_tiers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_tiers_updated_at
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tiers
INSERT INTO public.subscription_tiers (name, slug, description, price_monthly, features, limits, sort_order) VALUES
(
  'Free',
  'free',
  'Start your healing journey',
  0,
  '["5 messages per day", "Basic mood tracking", "Breathing exercises", "Journal entries"]'::jsonb,
  '{"messages_per_day": 5, "analytics": false, "priority_responses": false, "data_export": false, "ambient_sounds": false}'::jsonb,
  1
),
(
  'Pro',
  'pro',
  'Unlimited emotional support',
  12,
  '["Unlimited conversations", "Advanced mood analytics", "Priority AI responses", "Personalized insights", "Export your data", "Ambient sound library"]'::jsonb,
  '{"messages_per_day": -1, "analytics": true, "priority_responses": true, "data_export": true, "ambient_sounds": true}'::jsonb,
  2
),
(
  'Couples',
  'couples',
  'Heal together',
  19,
  '["Everything in Pro", "2 user accounts linked", "Shared progress tracking", "Couples communication tools", "Conflict resolution scripts", "Relationship health score"]'::jsonb,
  '{"messages_per_day": -1, "analytics": true, "priority_responses": true, "data_export": true, "ambient_sounds": true, "couples_features": true}'::jsonb,
  3
);
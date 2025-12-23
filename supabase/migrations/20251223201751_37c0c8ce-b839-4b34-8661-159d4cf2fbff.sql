-- Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'LUNA-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_referral_code_trigger ON public.profiles;
CREATE TRIGGER set_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Create referral_points table
CREATE TABLE public.referral_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_conversions INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'starter' CHECK (level IN ('starter', 'ambassador', 'champion', 'legend')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_point_transactions table
CREATE TABLE public.referral_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('referral_signup', 'referral_conversion', 'streak_bonus', 'redemption', 'bonus', 'milestone')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_redemptions table
CREATE TABLE public.referral_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_month_pro', 'free_month_couples', 'bonus_coins')),
  months_granted INTEGER,
  subscription_extended_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table
CREATE POLICY "Users can view referrals they made"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view if they were referred"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage referrals"
  ON public.referrals FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for referral_points table
CREATE POLICY "Users can view their own points"
  ON public.referral_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points record"
  ON public.referral_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage referral points"
  ON public.referral_points FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all referral points"
  ON public.referral_points FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referral_point_transactions table
CREATE POLICY "Users can view their own transactions"
  ON public.referral_point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.referral_point_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON public.referral_point_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for referral_redemptions table
CREATE POLICY "Users can view their own redemptions"
  ON public.referral_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
  ON public.referral_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage redemptions"
  ON public.referral_redemptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_referral_points_user_id ON public.referral_points(user_id);
CREATE INDEX idx_referral_point_transactions_user_id ON public.referral_point_transactions(user_id);
CREATE INDEX idx_referral_redemptions_user_id ON public.referral_redemptions(user_id);

-- Create function to update referral level based on total referrals
CREATE OR REPLACE FUNCTION public.update_referral_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_referrals >= 50 THEN
    NEW.level := 'legend';
  ELSIF NEW.total_referrals >= 15 THEN
    NEW.level := 'champion';
  ELSIF NEW.total_referrals >= 5 THEN
    NEW.level := 'ambassador';
  ELSE
    NEW.level := 'starter';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_referral_level_trigger ON public.referral_points;
CREATE TRIGGER update_referral_level_trigger
  BEFORE UPDATE ON public.referral_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_level();

-- Create view for leaderboard (anonymized)
CREATE OR REPLACE VIEW public.referral_leaderboard AS
SELECT 
  rp.user_id,
  COALESCE(p.display_name, 'Anonymous') as display_name,
  rp.lifetime_earned,
  rp.total_referrals,
  rp.successful_conversions,
  rp.level,
  rp.current_streak,
  ROW_NUMBER() OVER (ORDER BY rp.lifetime_earned DESC) as rank
FROM public.referral_points rp
LEFT JOIN public.profiles p ON rp.user_id = p.user_id
WHERE rp.total_referrals > 0
ORDER BY rp.lifetime_earned DESC
LIMIT 100;
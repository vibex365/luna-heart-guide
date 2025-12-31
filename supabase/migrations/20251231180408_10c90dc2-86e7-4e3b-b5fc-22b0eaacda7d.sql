-- Create game_visibility table for admin to control which games are shown
CREATE TABLE public.game_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_key TEXT NOT NULL UNIQUE,
  game_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_visibility ENABLE ROW LEVEL SECURITY;

-- Admins can manage game visibility
CREATE POLICY "Admins can manage game visibility"
ON public.game_visibility
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view visible games
CREATE POLICY "Anyone can view visible games"
ON public.game_visibility
FOR SELECT
USING (is_visible = true);

-- Insert default games
INSERT INTO public.game_visibility (game_key, game_name, description, category, is_visible, sort_order) VALUES
('spin_the_wheel', 'Spin The Wheel', 'Spin to get random prompts and activities', 'activities', true, 1),
('deal_breakers', 'Deal Breakers', 'Discover your deal breakers together', 'card_games', true, 2),
('would_you_rather', 'Would You Rather', 'Choose between two options', 'card_games', true, 3),
('truth_or_dare', 'Truth or Dare', 'Classic truth or dare game', 'card_games', true, 4),
('never_have_i_ever', 'Never Have I Ever', 'Reveal experiences together', 'card_games', true, 5),
('this_or_that', 'This or That', 'Quick preference choices', 'card_games', true, 6),
('two_truths_one_lie', 'Two Truths & One Lie', 'Guess which is the lie', 'quiz_games', true, 7),
('couples_quiz', 'Couples Quiz', 'Test how well you know each other', 'quiz_games', true, 8),
('love_trivia', 'Love Trivia Challenge', 'Romantic trivia questions', 'quiz_games', true, 9),
('newlywed_game', 'Newlywed Game', 'Classic couples guessing game', 'quiz_games', true, 10),
('hot_cold_game', 'Hot & Cold', 'Temperature-based guessing game', 'quiz_games', true, 11),
('most_likely_to', 'Most Likely To', 'Who is most likely to...', 'card_games', true, 12),
('finish_my_sentence', 'Finish My Sentence', 'Complete each others sentences', 'quiz_games', true, 13),
('predictions_game', 'Predictions Game', 'Predict your future together', 'activities', true, 14),
('drinking_game', 'Drinking Game', 'Fun drinking challenges', 'activities', true, 15),
('36_questions', '36 Questions', 'Questions to fall in love', 'deep_connection', true, 16),
('rate_the_fantasy', 'Rate The Fantasy', 'Rate romantic scenarios', 'intimate', true, 17),
('fantasy_cards', 'Fantasy Cards', 'Explore fantasies together', 'intimate', true, 18),
('tonights_plans', 'Tonights Plans', 'Plan your evening together', 'activities', true, 19),
('compliment_cards', 'Compliment Cards', 'Give genuine compliments', 'connection', true, 20),
('date_night_roulette', 'Date Night Roulette', 'Random date night ideas', 'activities', true, 21);

-- Create trigger for updated_at
CREATE TRIGGER update_game_visibility_updated_at
BEFORE UPDATE ON public.game_visibility
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix RLS on user_coins - ensure users can update their own balance
DROP POLICY IF EXISTS "Users can update their own coin balance" ON public.user_coins;
CREATE POLICY "Users can update their own coin balance"
ON public.user_coins
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own coin balance" ON public.user_coins;
CREATE POLICY "Users can insert their own coin balance"
ON public.user_coins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own coin balance" ON public.user_coins;
CREATE POLICY "Users can view their own coin balance"
ON public.user_coins
FOR SELECT
USING (auth.uid() = user_id);

-- Fix RLS on coin_transactions
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.coin_transactions;
CREATE POLICY "Users can insert their own transactions"
ON public.coin_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Admin policies for coins
DROP POLICY IF EXISTS "Admins can manage all coins" ON public.user_coins;
CREATE POLICY "Admins can manage all coins"
ON public.user_coins
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.coin_transactions;
CREATE POLICY "Admins can view all transactions"
ON public.coin_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the handle_new_user function to also grant signup bonuses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, onboarding_completed)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)), false)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Grant 50 signup coins
  INSERT INTO public.user_coins (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 50, 50)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Record coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 50, 'signup_bonus', 'Welcome gift - 50 free coins!');
  
  -- Grant 5 free voice minutes
  INSERT INTO public.user_minutes (user_id, minutes_balance, lifetime_purchased)
  VALUES (NEW.id, 5, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Record minutes transaction
  INSERT INTO public.minute_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 5, 'signup_bonus', 'Welcome gift - 5 free minutes with Luna Voice!');
  
  RETURN NEW;
END;
$$;
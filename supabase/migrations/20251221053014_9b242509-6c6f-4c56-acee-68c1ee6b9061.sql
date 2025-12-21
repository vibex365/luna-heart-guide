-- Add RLS policies for admin access to coin tables

-- Allow admins to view all coin transactions
CREATE POLICY "Admins can view all coin transactions"
ON public.coin_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert coin transactions (for giving coins)
CREATE POLICY "Admins can insert coin transactions"
ON public.coin_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all user coins
CREATE POLICY "Admins can view all user coins"
ON public.user_coins
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update user coins (for giving coins)
CREATE POLICY "Admins can update user coins"
ON public.user_coins
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert user coins
CREATE POLICY "Admins can insert user coins"
ON public.user_coins
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view couples messages for moderation
CREATE POLICY "Admins can view all couples messages"
ON public.couples_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all couples game sessions
CREATE POLICY "Admins can view all game sessions"
ON public.couples_game_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all intimate game sessions
CREATE POLICY "Admins can view all intimate game sessions"
ON public.intimate_game_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all couples game history
CREATE POLICY "Admins can view all game history"
ON public.couples_game_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all couples journal entries
CREATE POLICY "Admins can view all couples journal entries"
ON public.couples_journal_entries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view partner links
CREATE POLICY "Admins can view all partner links"
ON public.partner_links
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
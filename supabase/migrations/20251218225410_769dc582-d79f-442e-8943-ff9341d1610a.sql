-- Create truth_or_dare_sessions table for remote multiplayer
CREATE TABLE public.truth_or_dare_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  started_by UUID NOT NULL,
  mode TEXT, -- 'truth' or 'dare' or null if not selected yet
  is_spicy BOOLEAN DEFAULT false,
  current_card_index INTEGER DEFAULT 0,
  current_prompt TEXT,
  player_ready JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.truth_or_dare_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for truth_or_dare_sessions
CREATE POLICY "Partners can view their game sessions"
ON public.truth_or_dare_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = truth_or_dare_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can create game sessions"
ON public.truth_or_dare_sessions FOR INSERT
WITH CHECK (
  auth.uid() = started_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = truth_or_dare_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can update game sessions"
ON public.truth_or_dare_sessions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = truth_or_dare_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can delete game sessions"
ON public.truth_or_dare_sessions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = truth_or_dare_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

-- Create never_have_i_ever_sessions table for remote multiplayer
CREATE TABLE public.never_have_i_ever_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  started_by UUID NOT NULL,
  statement_index INTEGER DEFAULT 0,
  current_statement TEXT,
  is_spicy BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.never_have_i_ever_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for never_have_i_ever_sessions
CREATE POLICY "Partners can view their game sessions"
ON public.never_have_i_ever_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = never_have_i_ever_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can create game sessions"
ON public.never_have_i_ever_sessions FOR INSERT
WITH CHECK (
  auth.uid() = started_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = never_have_i_ever_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can update game sessions"
ON public.never_have_i_ever_sessions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = never_have_i_ever_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can delete game sessions"
ON public.never_have_i_ever_sessions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = never_have_i_ever_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.truth_or_dare_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.never_have_i_ever_sessions;

-- Update existing profiles to include gameStarted in SMS preferences
UPDATE public.profiles 
SET sms_notification_preferences = 
  jsonb_set(
    COALESCE(sms_notification_preferences, '{}'::jsonb),
    '{gameStarted}',
    'true'
  )
WHERE sms_notification_preferences IS NULL 
   OR NOT (sms_notification_preferences ? 'gameStarted');
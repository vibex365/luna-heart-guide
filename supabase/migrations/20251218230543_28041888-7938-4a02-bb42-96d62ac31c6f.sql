-- Create intimate_game_sessions table for Finish My Sentence and Rate the Fantasy games
CREATE TABLE public.intimate_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  started_by UUID NOT NULL,
  game_type TEXT NOT NULL, -- 'finish_sentence' or 'rate_fantasy'
  current_prompt_index INTEGER NOT NULL DEFAULT 0,
  player_responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"user1_id": "response", "user2_id": "response"}
  revealed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intimate_game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view their game sessions"
ON public.intimate_game_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = intimate_game_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can create game sessions"
ON public.intimate_game_sessions FOR INSERT
WITH CHECK (
  auth.uid() = started_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = intimate_game_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can update game sessions"
ON public.intimate_game_sessions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = intimate_game_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

CREATE POLICY "Partners can delete game sessions"
ON public.intimate_game_sessions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM partner_links pl
  WHERE pl.id = intimate_game_sessions.partner_link_id
  AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
  AND pl.status = 'accepted'
));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intimate_game_sessions;
-- Create table for couples game sessions (active games)
CREATE TABLE public.couples_game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'would_you_rather', 'truth_or_dare', 'never_have_i_ever', 'quiz', 'conversation_starters'
  current_card_index INTEGER NOT NULL DEFAULT 0,
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores current answers, selections, etc.
  started_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for game history/scores
CREATE TABLE public.couples_game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  played_by UUID NOT NULL,
  partner_played BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.couples_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_game_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for game sessions
CREATE POLICY "Partners can view their game sessions"
ON public.couples_game_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can create game sessions"
ON public.couples_game_sessions FOR INSERT
WITH CHECK (
  auth.uid() = started_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can update game sessions"
ON public.couples_game_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can delete game sessions"
ON public.couples_game_sessions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- RLS policies for game history
CREATE POLICY "Partners can view their game history"
ON public.couples_game_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_history.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can insert game history"
ON public.couples_game_history FOR INSERT
WITH CHECK (
  auth.uid() = played_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_game_history.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Enable realtime for game sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_game_sessions;

-- Create trigger for updated_at
CREATE TRIGGER update_couples_game_sessions_updated_at
  BEFORE UPDATE ON public.couples_game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
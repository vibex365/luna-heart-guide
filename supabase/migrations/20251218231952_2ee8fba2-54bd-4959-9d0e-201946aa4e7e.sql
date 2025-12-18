-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view voice messages in their couple"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM partner_links 
      WHERE (user_id = auth.uid() AND partner_id::text = (storage.foldername(name))[1])
         OR (partner_id = auth.uid() AND user_id::text = (storage.foldername(name))[1])
    )
  )
);

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create this_or_that_sessions table for the game
CREATE TABLE public.this_or_that_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  started_by UUID NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  player_answers JSONB DEFAULT '{}',
  total_questions INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.this_or_that_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their couple's this_or_that sessions"
ON public.this_or_that_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links 
    WHERE id = partner_link_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
  )
);

CREATE POLICY "Users can create this_or_that sessions for their couple"
ON public.this_or_that_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partner_links 
    WHERE id = partner_link_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
  )
);

CREATE POLICY "Users can update their couple's this_or_that sessions"
ON public.this_or_that_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links 
    WHERE id = partner_link_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their couple's this_or_that sessions"
ON public.this_or_that_sessions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links 
    WHERE id = partner_link_id 
    AND (user_id = auth.uid() OR partner_id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.this_or_that_sessions;

-- Add voice_message_url column to intimate_game_sessions
ALTER TABLE public.intimate_game_sessions 
ADD COLUMN IF NOT EXISTS voice_messages JSONB DEFAULT '{}';
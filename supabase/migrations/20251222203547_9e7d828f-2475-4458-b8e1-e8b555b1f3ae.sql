-- Add audio_url column to voice_sessions table
ALTER TABLE public.voice_sessions 
ADD COLUMN IF NOT EXISTS audio_url text;

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT DO NOTHING;

-- RLS policies for voice recordings
CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add couples_luna_insights table for conversation summaries
CREATE TABLE IF NOT EXISTS public.couples_luna_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'conversation_summary',
  content TEXT NOT NULL,
  message_count INTEGER,
  key_topics TEXT[],
  sentiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on couples_luna_insights
ALTER TABLE public.couples_luna_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for insights
CREATE POLICY "Users can view insights for their partner links"
ON public.couples_luna_insights FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Users can create insights for their partner links"
ON public.couples_luna_insights FOR INSERT
WITH CHECK (
  generated_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Enable realtime for insights
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_luna_insights;
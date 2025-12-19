-- Create couples_messages table for private chat
CREATE TABLE public.couples_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'video', 'image')),
  content TEXT,
  media_url TEXT,
  media_duration INTEGER,
  thumbnail_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_couples_messages_partner_link ON couples_messages(partner_link_id);
CREATE INDEX idx_couples_messages_created_at ON couples_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.couples_messages ENABLE ROW LEVEL SECURITY;

-- Partners can view their messages
CREATE POLICY "Partners can view their messages"
ON public.couples_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can send messages
CREATE POLICY "Partners can send messages"
ON public.couples_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can update messages (mark as read)
CREATE POLICY "Partners can update messages"
ON public.couples_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can delete their own messages
CREATE POLICY "Partners can delete their messages"
ON public.couples_messages
FOR DELETE
USING (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Enable realtime for instant messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_messages;

-- Create couples-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('couples-media', 'couples-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for couples-media bucket
CREATE POLICY "Partners can upload media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'couples-media' AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE (storage.foldername(name))[1] = pl.id::text
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can view their media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'couples-media' AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE (storage.foldername(name))[1] = pl.id::text
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

CREATE POLICY "Partners can delete their own media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'couples-media' AND
  (storage.foldername(name))[2] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE (storage.foldername(name))[1] = pl.id::text
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);
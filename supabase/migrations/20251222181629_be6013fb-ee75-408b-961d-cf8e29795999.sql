-- Create couples_luna_messages table for shared Luna chat
CREATE TABLE public.couples_luna_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_couples_luna_messages_partner_link ON public.couples_luna_messages(partner_link_id);
CREATE INDEX idx_couples_luna_messages_created_at ON public.couples_luna_messages(partner_link_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.couples_luna_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view their shared messages
CREATE POLICY "Partners can view their Luna messages"
ON public.couples_luna_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_luna_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- RLS Policy: Partners can insert messages
CREATE POLICY "Partners can insert Luna messages"
ON public.couples_luna_messages
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id OR role = 'assistant') AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_luna_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- RLS Policy: Partners can delete their messages
CREATE POLICY "Partners can delete their Luna messages"
ON public.couples_luna_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_luna_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Enable realtime for live sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples_luna_messages;
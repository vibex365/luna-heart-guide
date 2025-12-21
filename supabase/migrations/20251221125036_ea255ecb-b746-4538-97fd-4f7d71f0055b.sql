-- Create time_capsule_messages table for scheduling future love messages
CREATE TABLE public.time_capsule_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  voice_url TEXT,
  video_url TEXT,
  deliver_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  is_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying of pending capsules
CREATE INDEX idx_time_capsules_delivery ON public.time_capsule_messages(deliver_at, is_delivered) WHERE is_delivered = false;

-- Create index for partner link lookups
CREATE INDEX idx_time_capsules_partner_link ON public.time_capsule_messages(partner_link_id);

-- Enable RLS
ALTER TABLE public.time_capsule_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create time capsules for their partner
CREATE POLICY "Users can create time capsules for partner"
ON public.time_capsule_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = time_capsule_messages.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Policy: Users can view their own sent capsules
CREATE POLICY "Users can view sent time capsules"
ON public.time_capsule_messages
FOR SELECT
USING (auth.uid() = sender_id);

-- Policy: Users can view delivered capsules addressed to them
CREATE POLICY "Users can view received delivered time capsules"
ON public.time_capsule_messages
FOR SELECT
USING (auth.uid() = recipient_id AND is_delivered = true);

-- Policy: Recipients can update capsules they received (to mark as opened)
CREATE POLICY "Recipients can mark capsules as opened"
ON public.time_capsule_messages
FOR UPDATE
USING (auth.uid() = recipient_id AND is_delivered = true);

-- Policy: Senders can delete their own pending capsules
CREATE POLICY "Senders can delete pending capsules"
ON public.time_capsule_messages
FOR DELETE
USING (auth.uid() = sender_id AND is_delivered = false);

-- Add trigger for updated_at
CREATE TRIGGER update_time_capsule_messages_updated_at
BEFORE UPDATE ON public.time_capsule_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_capsule_messages;
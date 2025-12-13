-- Create table for appreciation entries
CREATE TABLE public.appreciation_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  appreciation_text TEXT NOT NULL,
  is_visible_to_partner BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appreciation_entries ENABLE ROW LEVEL SECURITY;

-- Partners can view appreciation entries
CREATE POLICY "Partners can view appreciation entries"
ON public.appreciation_entries
FOR SELECT
USING (
  (user_id = auth.uid()) OR
  (is_visible_to_partner = true AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = appreciation_entries.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  ))
);

-- Users can insert their own entries
CREATE POLICY "Users can insert appreciation entries"
ON public.appreciation_entries
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = appreciation_entries.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Enable realtime for appreciation entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.appreciation_entries;
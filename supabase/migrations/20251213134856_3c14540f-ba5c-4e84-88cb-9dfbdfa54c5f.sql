-- Create table for saved date night ideas
CREATE TABLE public.date_night_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'adventure',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.date_night_ideas ENABLE ROW LEVEL SECURITY;

-- Partners can view their date night ideas
CREATE POLICY "Partners can view their date night ideas"
ON public.date_night_ideas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = date_night_ideas.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can insert date night ideas
CREATE POLICY "Partners can insert date night ideas"
ON public.date_night_ideas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = date_night_ideas.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can update date night ideas
CREATE POLICY "Partners can update date night ideas"
ON public.date_night_ideas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = date_night_ideas.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can delete date night ideas
CREATE POLICY "Partners can delete date night ideas"
ON public.date_night_ideas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = date_night_ideas.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);
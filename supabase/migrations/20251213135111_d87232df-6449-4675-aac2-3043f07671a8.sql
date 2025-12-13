-- Create table for relationship milestones
CREATE TABLE public.relationship_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  icon TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relationship_milestones ENABLE ROW LEVEL SECURITY;

-- Partners can view their milestones
CREATE POLICY "Partners can view their milestones"
ON public.relationship_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = relationship_milestones.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can insert milestones
CREATE POLICY "Partners can insert milestones"
ON public.relationship_milestones
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = relationship_milestones.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can update milestones
CREATE POLICY "Partners can update milestones"
ON public.relationship_milestones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = relationship_milestones.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can delete milestones
CREATE POLICY "Partners can delete milestones"
ON public.relationship_milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = relationship_milestones.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);
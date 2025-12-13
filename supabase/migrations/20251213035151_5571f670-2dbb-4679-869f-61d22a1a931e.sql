-- Create couple goals table
CREATE TABLE public.couple_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.couple_goals ENABLE ROW LEVEL SECURITY;

-- Partners can view their shared goals
CREATE POLICY "Partners can view their goals"
ON public.couple_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couple_goals.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can create goals
CREATE POLICY "Partners can create goals"
ON public.couple_goals
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couple_goals.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can update their goals
CREATE POLICY "Partners can update goals"
ON public.couple_goals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couple_goals.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can delete their goals
CREATE POLICY "Partners can delete goals"
ON public.couple_goals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couple_goals.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_couple_goals_updated_at
BEFORE UPDATE ON public.couple_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Digital gift catalog
CREATE TABLE public.digital_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  icon TEXT NOT NULL,
  animation_type TEXT NOT NULL,
  category TEXT DEFAULT 'romantic',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_gifts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active gifts
CREATE POLICY "Anyone can view active digital gifts"
ON public.digital_gifts
FOR SELECT
USING (is_active = true);

-- Admins can manage gifts
CREATE POLICY "Admins can manage digital gifts"
ON public.digital_gifts
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Sent gifts between partners
CREATE TABLE public.partner_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  gift_id UUID NOT NULL REFERENCES public.digital_gifts(id),
  message TEXT,
  is_opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_gifts ENABLE ROW LEVEL SECURITY;

-- Partners can view their gifts
CREATE POLICY "Partners can view their gifts"
ON public.partner_gifts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = partner_gifts.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can send gifts
CREATE POLICY "Partners can send gifts"
ON public.partner_gifts
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = partner_gifts.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Recipients can update gift (mark as opened)
CREATE POLICY "Recipients can update gifts"
ON public.partner_gifts
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Enable realtime for partner_gifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_gifts;
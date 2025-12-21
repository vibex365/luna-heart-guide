-- Create partner_suggestions table
CREATE TABLE public.partner_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  for_user_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  action_hint TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_acted_on BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view suggestions meant for them
CREATE POLICY "Users can view their suggestions"
ON public.partner_suggestions
FOR SELECT
USING (auth.uid() = for_user_id);

-- Users can update (dismiss/act on) their own suggestions
CREATE POLICY "Users can update their suggestions"
ON public.partner_suggestions
FOR UPDATE
USING (auth.uid() = for_user_id);

-- Edge function can insert suggestions (service role)
CREATE POLICY "Service role can insert suggestions"
ON public.partner_suggestions
FOR INSERT
WITH CHECK (true);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.partner_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_partner_suggestions_for_user ON public.partner_suggestions(for_user_id, is_dismissed, expires_at);
CREATE INDEX idx_partner_suggestions_partner_link ON public.partner_suggestions(partner_link_id);
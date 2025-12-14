-- Create leads table for storing ManyChat subscribers and funnel leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  first_name TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manychat',
  utm_source TEXT DEFAULT 'instagram',
  utm_medium TEXT DEFAULT 'dm',
  utm_campaign TEXT DEFAULT 'manychat',
  utm_content TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  converted_at TIMESTAMP WITH TIME ZONE,
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  interaction_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subscriber_id, source)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all leads
CREATE POLICY "Admins can manage leads"
  ON public.leads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert leads (for webhook)
CREATE POLICY "Service can insert leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Service role can update leads
CREATE POLICY "Service can update leads"
  ON public.leads
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_leads_subscriber_id ON public.leads(subscriber_id);
CREATE INDEX idx_leads_segment ON public.leads(segment);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create funnel_events table for tracking funnel analytics
CREATE TABLE public.funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL, -- 'page_view', 'checkout_start', 'checkout_complete'
  funnel_type text NOT NULL, -- 'dm', 'couples'
  utm_source text DEFAULT 'direct',
  utm_medium text DEFAULT 'none',
  utm_campaign text DEFAULT 'none',
  utm_content text DEFAULT 'none',
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (for tracking before auth)
CREATE POLICY "Anyone can insert funnel events"
ON public.funnel_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view funnel events
CREATE POLICY "Admins can view funnel events"
ON public.funnel_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster analytics queries
CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_funnel_type ON public.funnel_events (funnel_type);
CREATE INDEX idx_funnel_events_utm_source ON public.funnel_events (utm_source);
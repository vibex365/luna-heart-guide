-- Create visitor_locations table for geolocation tracking
CREATE TABLE public.visitor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_path TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_visitor_locations_session ON public.visitor_locations(session_id);
CREATE INDEX idx_visitor_locations_created ON public.visitor_locations(created_at DESC);
CREATE INDEX idx_visitor_locations_country ON public.visitor_locations(country_code);
CREATE INDEX idx_visitor_locations_region ON public.visitor_locations(region);

-- Enable RLS
ALTER TABLE public.visitor_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert visitor locations"
ON public.visitor_locations
FOR INSERT
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view visitor locations"
ON public.visitor_locations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create tracking_events table for all user interactions
CREATE TABLE public.tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'button_click', 'link_click', 'form_submit', 'pixel_view', 'page_view', 'custom'
  event_name TEXT NOT NULL,
  page_path TEXT,
  element_id TEXT,
  element_text TEXT,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  user_agent TEXT,
  referrer TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_tracking_events_session ON public.tracking_events(session_id);
CREATE INDEX idx_tracking_events_type ON public.tracking_events(event_type);
CREATE INDEX idx_tracking_events_name ON public.tracking_events(event_name);
CREATE INDEX idx_tracking_events_created ON public.tracking_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert tracking events"
ON public.tracking_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view tracking events"
ON public.tracking_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for tracking_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;

-- Create automated_push_campaigns table
CREATE TABLE public.automated_push_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'abandoned_action', 'inactive_visitor', 'welcome_back', 'engagement'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  delay_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automated_push_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can manage campaigns
CREATE POLICY "Admins can manage automated push campaigns"
ON public.automated_push_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view campaigns (needed for edge functions)
CREATE POLICY "Anyone can view active campaigns"
ON public.automated_push_campaigns
FOR SELECT
USING (is_active = true);

-- Create automated_push_logs table
CREATE TABLE public.automated_push_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.automated_push_campaigns(id),
  subscription_id UUID,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'clicked'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_automated_push_logs_campaign ON public.automated_push_logs(campaign_id);
CREATE INDEX idx_automated_push_logs_session ON public.automated_push_logs(session_id);
CREATE INDEX idx_automated_push_logs_created ON public.automated_push_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.automated_push_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert logs (for edge functions)
CREATE POLICY "Anyone can insert push logs"
ON public.automated_push_logs
FOR INSERT
WITH CHECK (true);

-- Admins can view logs
CREATE POLICY "Admins can view push logs"
ON public.automated_push_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default automated campaigns
INSERT INTO public.automated_push_campaigns (name, trigger_type, title, body, url, delay_minutes, is_active) VALUES
('Welcome Back', 'welcome_back', 'Welcome Back! 👋', 'We missed you! Come see what''s new.', '/', 1440, true),
('Inactive Reminder', 'inactive_visitor', 'Haven''t seen you in a while!', 'Check out our latest updates.', '/', 2880, true),
('Engagement Boost', 'engagement', 'Thanks for visiting!', 'Subscribe for updates and exclusive content.', '/subscription', 60, true);
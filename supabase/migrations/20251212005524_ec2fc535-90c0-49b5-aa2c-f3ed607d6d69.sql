-- Create conversation_analytics table to track Luna module usage
CREATE TABLE public.conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  module_activated TEXT NOT NULL,
  trigger_detected TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analytics"
ON public.conversation_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics"
ON public.conversation_analytics FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_conversation_analytics_user_id ON public.conversation_analytics(user_id);
CREATE INDEX idx_conversation_analytics_module ON public.conversation_analytics(module_activated);
CREATE INDEX idx_conversation_analytics_created_at ON public.conversation_analytics(created_at DESC);
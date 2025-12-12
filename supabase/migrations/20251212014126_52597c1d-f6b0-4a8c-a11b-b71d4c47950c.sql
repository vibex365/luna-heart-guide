-- Create flagged conversations table
CREATE TABLE public.flagged_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  flag_type text NOT NULL DEFAULT 'crisis',
  severity text NOT NULL DEFAULT 'medium',
  trigger_phrase text,
  message_content text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flagged_conversations ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all flagged conversations
CREATE POLICY "Admins can manage flagged conversations"
ON public.flagged_conversations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can insert flags (from edge function)
CREATE POLICY "Service role can insert flags"
ON public.flagged_conversations FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_flagged_conversations_updated_at
BEFORE UPDATE ON public.flagged_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_flagged_conversations_status ON public.flagged_conversations(status);
CREATE INDEX idx_flagged_conversations_severity ON public.flagged_conversations(severity);
CREATE INDEX idx_flagged_conversations_created_at ON public.flagged_conversations(created_at DESC);
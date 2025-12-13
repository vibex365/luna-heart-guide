-- Create admin action log table
CREATE TABLE public.admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert logs
CREATE POLICY "Admins can view action logs"
ON public.admin_action_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert action logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_admin_action_logs_created_at ON public.admin_action_logs(created_at DESC);
CREATE INDEX idx_admin_action_logs_target_user ON public.admin_action_logs(target_user_id);
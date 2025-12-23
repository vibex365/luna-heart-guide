-- Fix #1: Voice sessions - Ensure partners can only view COUPLES sessions, not solo sessions
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Partners can view couples sessions" ON voice_sessions;

-- Create stricter policy that explicitly excludes solo sessions
CREATE POLICY "Partners can view couples sessions only"
ON voice_sessions
FOR SELECT
USING (
  partner_link_id IS NOT NULL 
  AND session_type = 'couples'
  AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = voice_sessions.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Fix #2: IAP receipts - Remove overly permissive service role policy
-- Service role bypasses RLS anyway, so this policy is unnecessary and misleading
DROP POLICY IF EXISTS "Service role can manage IAP receipts" ON iap_receipts;

-- Fix #3: Leads table - Remove overly permissive service policies
-- Service role bypasses RLS anyway
DROP POLICY IF EXISTS "Service can insert leads" ON leads;
DROP POLICY IF EXISTS "Service can update leads" ON leads;

-- Fix #4: Flagged conversations - Service role insert is fine (backend use)
-- But add a more restrictive policy description
DROP POLICY IF EXISTS "Service role can insert flags" ON flagged_conversations;

-- Recreate with clearer naming (service role bypasses RLS anyway, this is just documentation)
-- The actual security is that only backend can use service role key

-- Fix #5: Create admin_audit_logs table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (append-only - no delete allowed)
CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only service role can insert (via backend functions)
-- No UPDATE or DELETE policies = append-only table

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Fix: Restrict the 'Users can find pending invites by code' policy
-- to only allow viewing when user explicitly searches by invite_code
-- This prevents enumeration of all pending invites

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can find pending invites by code" ON public.partner_links;

-- The application flow for accepting invites works as follows:
-- 1. User enters an invite code in the UI
-- 2. App queries: SELECT * FROM partner_links WHERE invite_code = 'XXXXX' AND status = 'pending'
-- 3. If found, user can accept the invite

-- Since RLS policies can't dynamically restrict based on query parameters,
-- we need a different approach. The safest option is:
-- Remove this policy entirely and rely on a secure RPC function instead.

-- Create a secure function to lookup invite by code
CREATE OR REPLACE FUNCTION public.get_pending_invite_by_code(p_invite_code text)
RETURNS TABLE (
  id uuid,
  invite_code text,
  status text,
  user_id uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pl.id,
    pl.invite_code,
    pl.status,
    pl.user_id,
    pl.created_at
  FROM partner_links pl
  WHERE pl.invite_code = p_invite_code
    AND pl.status = 'pending'
    AND pl.user_id != auth.uid()  -- Can't accept your own invite
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_pending_invite_by_code(text) TO authenticated;

-- Add a comment explaining the function's purpose
COMMENT ON FUNCTION public.get_pending_invite_by_code IS 'Securely lookup a partner invite by exact code without exposing all pending invites';

-- Allow users to find pending invites by invite code (needed for accepting invites)
CREATE POLICY "Users can find pending invites by code"
ON public.partner_links
FOR SELECT
USING (status = 'pending');
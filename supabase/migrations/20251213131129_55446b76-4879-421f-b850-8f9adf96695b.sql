-- Allow authenticated users to accept pending invites (set themselves as partner_id)
CREATE POLICY "Users can accept pending invites"
ON public.partner_links
FOR UPDATE
USING (
  status = 'pending' 
  AND auth.uid() != user_id
)
WITH CHECK (
  partner_id = auth.uid()
  AND status = 'accepted'
);
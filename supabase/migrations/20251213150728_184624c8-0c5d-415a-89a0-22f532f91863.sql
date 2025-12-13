-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own assessments" ON relationship_assessments;

-- Create a new policy that allows partners to view each other's assessments
CREATE POLICY "Partners can view assessments"
ON relationship_assessments
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = relationship_assessments.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  ))
);
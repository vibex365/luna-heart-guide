-- Add reactions and reply_to_id columns to couples_messages
ALTER TABLE couples_messages 
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES couples_messages(id) ON DELETE SET NULL;

-- Create typing_status table for real-time typing indicators
CREATE TABLE IF NOT EXISTS couples_typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id uuid NOT NULL REFERENCES partner_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_link_id, user_id)
);

-- Enable RLS on typing_status
ALTER TABLE couples_typing_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing status
CREATE POLICY "Partners can view typing status"
  ON couples_typing_status FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_typing_status.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  ));

CREATE POLICY "Partners can insert typing status"
  ON couples_typing_status FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = couples_typing_status.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Partners can update typing status"
  ON couples_typing_status FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = couples_typing_status.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Partners can delete typing status"
  ON couples_typing_status FOR DELETE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = couples_typing_status.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

-- Enable realtime for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE couples_typing_status;
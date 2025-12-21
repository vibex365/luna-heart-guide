-- Add unique constraint for typing status upsert
ALTER TABLE couples_typing_status 
ADD CONSTRAINT couples_typing_status_partner_user_unique 
UNIQUE (partner_link_id, user_id);
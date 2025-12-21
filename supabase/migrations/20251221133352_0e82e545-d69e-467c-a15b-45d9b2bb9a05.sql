-- Drop the existing check constraint and add a new one that includes 'sticker'
ALTER TABLE couples_messages DROP CONSTRAINT IF EXISTS couples_messages_message_type_check;
ALTER TABLE couples_messages ADD CONSTRAINT couples_messages_message_type_check 
  CHECK (message_type IN ('text', 'voice', 'video', 'image', 'sticker'));
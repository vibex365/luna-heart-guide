-- Drop all RLS policies on sms_verification_codes
DROP POLICY IF EXISTS "Users can view their own verification codes" ON sms_verification_codes;
DROP POLICY IF EXISTS "Users can create their own verification codes" ON sms_verification_codes;
DROP POLICY IF EXISTS "Users can update their own verification codes" ON sms_verification_codes;
DROP POLICY IF EXISTS "Users can delete their own verification codes" ON sms_verification_codes;

-- Change user_id column from UUID to TEXT to support temporary IDs during signup
ALTER TABLE sms_verification_codes 
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate the RLS policies with text comparison
CREATE POLICY "Users can view their own verification codes" 
  ON sms_verification_codes 
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own verification codes" 
  ON sms_verification_codes 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own verification codes" 
  ON sms_verification_codes 
  FOR UPDATE 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own verification codes" 
  ON sms_verification_codes 
  FOR DELETE 
  USING (user_id = auth.uid()::text);
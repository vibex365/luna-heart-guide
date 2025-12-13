-- Add phone number fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Create SMS verification codes table
CREATE TABLE public.sms_verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_verification_codes
CREATE POLICY "Users can view their own verification codes"
ON public.sms_verification_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification codes"
ON public.sms_verification_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification codes"
ON public.sms_verification_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_sms_verification_codes_user_phone ON public.sms_verification_codes(user_id, phone_number);
CREATE INDEX idx_sms_verification_codes_expires ON public.sms_verification_codes(expires_at);
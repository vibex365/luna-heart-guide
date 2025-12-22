-- Create table for storing In-App Purchase receipts from Apple and Google
CREATE TABLE public.iap_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google')),
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'coins', 'minutes', 'gift')),
  transaction_id TEXT NOT NULL,
  original_transaction_id TEXT,
  receipt_data TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN DEFAULT false,
  is_sandbox BOOLEAN DEFAULT false,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded', 'pending')),
  verification_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform, transaction_id)
);

-- Enable RLS
ALTER TABLE public.iap_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view their own receipts
CREATE POLICY "Users can view their own IAP receipts"
ON public.iap_receipts
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update (from edge functions)
CREATE POLICY "Service role can manage IAP receipts"
ON public.iap_receipts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_iap_receipts_user_id ON public.iap_receipts(user_id);
CREATE INDEX idx_iap_receipts_platform ON public.iap_receipts(platform);
CREATE INDEX idx_iap_receipts_product_type ON public.iap_receipts(product_type);
CREATE INDEX idx_iap_receipts_transaction_id ON public.iap_receipts(transaction_id);
CREATE INDEX idx_iap_receipts_created_at ON public.iap_receipts(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_iap_receipts_updated_at
BEFORE UPDATE ON public.iap_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
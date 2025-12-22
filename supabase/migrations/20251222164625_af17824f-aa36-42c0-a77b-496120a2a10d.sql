-- Create enum for voice session status
CREATE TYPE voice_session_status AS ENUM ('initiated', 'connecting', 'active', 'ended', 'failed', 'no_balance');

-- Create enum for minute transaction type
CREATE TYPE minute_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');

-- User minutes wallet
CREATE TABLE public.user_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  minutes_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  lifetime_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_minutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_minutes
CREATE POLICY "Users can view their own minutes" ON public.user_minutes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own minutes record" ON public.user_minutes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own minutes" ON public.user_minutes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all minutes" ON public.user_minutes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Minute packages (admin managed)
CREATE TABLE public.minute_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  savings_percent INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.minute_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for minute_packages
CREATE POLICY "Anyone can view active packages" ON public.minute_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.minute_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Minute transactions
CREATE TABLE public.minute_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type minute_transaction_type NOT NULL,
  description TEXT,
  package_id UUID REFERENCES public.minute_packages(id),
  voice_session_id UUID,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.minute_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for minute_transactions
CREATE POLICY "Users can view their own transactions" ON public.minute_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.minute_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.minute_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Voice sessions
CREATE TABLE public.voice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_link_id UUID REFERENCES public.partner_links(id),
  session_type TEXT NOT NULL DEFAULT 'solo' CHECK (session_type IN ('solo', 'couples')),
  status voice_session_status NOT NULL DEFAULT 'initiated',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  minutes_billed INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  luna_context_summary TEXT,
  safety_flagged BOOLEAN DEFAULT false,
  safety_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_sessions
CREATE POLICY "Users can view their own sessions" ON public.voice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.voice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Partners can view couples sessions" ON public.voice_sessions
  FOR SELECT USING (
    partner_link_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM partner_links pl
      WHERE pl.id = voice_sessions.partner_link_id
      AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
      AND pl.status = 'accepted'
    )
  );

CREATE POLICY "Admins can view all sessions" ON public.voice_sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all sessions" ON public.voice_sessions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key for minute_transactions to voice_sessions
ALTER TABLE public.minute_transactions
  ADD CONSTRAINT minute_transactions_voice_session_id_fkey
  FOREIGN KEY (voice_session_id) REFERENCES public.voice_sessions(id);

-- Create indexes for performance
CREATE INDEX idx_user_minutes_user_id ON public.user_minutes(user_id);
CREATE INDEX idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX idx_minute_transactions_user_id ON public.minute_transactions(user_id);
CREATE INDEX idx_minute_transactions_type ON public.minute_transactions(transaction_type);

-- Insert default minute packages ($0.25/min base rate)
INSERT INTO public.minute_packages (name, description, minutes, price_cents, savings_percent, is_popular, sort_order) VALUES
  ('Try It', 'Perfect for your first Luna Voice experience', 12, 299, 0, false, 1),
  ('Starter', 'Great for regular check-ins', 50, 999, 20, false, 2),
  ('Popular', 'Our most popular package', 120, 1999, 33, true, 3),
  ('Power User', 'Best value for frequent conversations', 350, 4999, 43, false, 4);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_minutes_updated_at
  BEFORE UPDATE ON public.user_minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_sessions_updated_at
  BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_minute_packages_updated_at
  BEFORE UPDATE ON public.minute_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for voice sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_sessions;
-- Create message feedback table
CREATE TABLE public.message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type text,
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create feedback for their own conversations
CREATE POLICY "Users can create feedback"
ON public.message_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.message_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.message_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_message_feedback_message ON public.message_feedback(message_id);
CREATE INDEX idx_message_feedback_user ON public.message_feedback(user_id);
CREATE INDEX idx_message_feedback_rating ON public.message_feedback(rating);
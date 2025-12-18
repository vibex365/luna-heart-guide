-- Create table for storing each partner's self-answers
CREATE TABLE public.quiz_self_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(partner_link_id, user_id)
);

-- Enable RLS
ALTER TABLE public.quiz_self_answers ENABLE ROW LEVEL SECURITY;

-- Partners can view their own answers
CREATE POLICY "Users can view their own quiz answers"
ON public.quiz_self_answers
FOR SELECT
USING (auth.uid() = user_id);

-- Partners can view each other's answers (for grading)
CREATE POLICY "Partners can view each other's quiz answers"
ON public.quiz_self_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = quiz_self_answers.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Users can insert their own answers
CREATE POLICY "Users can insert their own quiz answers"
ON public.quiz_self_answers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = quiz_self_answers.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Users can update their own answers
CREATE POLICY "Users can update their own quiz answers"
ON public.quiz_self_answers
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_self_answers_updated_at
BEFORE UPDATE ON public.quiz_self_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for quiz answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_self_answers;
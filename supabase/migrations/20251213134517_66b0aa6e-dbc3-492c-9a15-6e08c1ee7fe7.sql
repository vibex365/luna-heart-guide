-- Create table for Would You Rather answers
CREATE TABLE public.would_you_rather_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.would_you_rather_answers ENABLE ROW LEVEL SECURITY;

-- Users can view answers from their partner link
CREATE POLICY "Users can view answers from their couple"
ON public.would_you_rather_answers
FOR SELECT
USING (
  partner_link_id IN (
    SELECT id FROM public.partner_links 
    WHERE user_id = auth.uid() OR partner_id = auth.uid()
  )
);

-- Users can insert their own answers
CREATE POLICY "Users can insert their own answers"
ON public.would_you_rather_answers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  partner_link_id IN (
    SELECT id FROM public.partner_links 
    WHERE user_id = auth.uid() OR partner_id = auth.uid()
  )
);

-- Users can delete their own answers
CREATE POLICY "Users can delete their own answers"
ON public.would_you_rather_answers
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.would_you_rather_answers;
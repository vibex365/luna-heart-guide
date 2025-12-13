-- Track assessment completions
CREATE TABLE public.relationship_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_link_id uuid NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  communication_answers jsonb NOT NULL DEFAULT '[]',
  trust_answers jsonb NOT NULL DEFAULT '[]',
  intimacy_answers jsonb NOT NULL DEFAULT '[]',
  conflict_answers jsonb NOT NULL DEFAULT '[]',
  communication_score integer NOT NULL CHECK (communication_score >= 0 AND communication_score <= 100),
  trust_score integer NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  intimacy_score integer NOT NULL CHECK (intimacy_score >= 0 AND intimacy_score <= 100),
  conflict_score integer NOT NULL CHECK (conflict_score >= 0 AND conflict_score <= 100),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_link_id, user_id, assessment_date)
);

-- Enable RLS
ALTER TABLE public.relationship_assessments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own assessments"
ON public.relationship_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create assessments for their partner link"
ON public.relationship_assessments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.partner_links pl
    WHERE pl.id = partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Function to update health scores when both partners complete assessment
CREATE OR REPLACE FUNCTION update_relationship_health_from_assessments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_assessment relationship_assessments%ROWTYPE;
  avg_communication integer;
  avg_trust integer;
  avg_intimacy integer;
  avg_conflict integer;
BEGIN
  -- Check if partner has also completed an assessment today
  SELECT * INTO partner_assessment
  FROM relationship_assessments
  WHERE partner_link_id = NEW.partner_link_id
    AND user_id != NEW.user_id
    AND assessment_date = NEW.assessment_date;

  IF FOUND THEN
    -- Calculate averages from both partners
    avg_communication := (NEW.communication_score + partner_assessment.communication_score) / 2;
    avg_trust := (NEW.trust_score + partner_assessment.trust_score) / 2;
    avg_intimacy := (NEW.intimacy_score + partner_assessment.intimacy_score) / 2;
    avg_conflict := (NEW.conflict_score + partner_assessment.conflict_score) / 2;

    -- Update the relationship health scores
    UPDATE relationship_health_scores
    SET 
      communication_score = avg_communication,
      trust_score = avg_trust,
      intimacy_score = avg_intimacy,
      conflict_resolution_score = avg_conflict,
      last_assessment_at = now(),
      updated_at = now()
    WHERE partner_link_id = NEW.partner_link_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update health scores
CREATE TRIGGER on_assessment_completed
  AFTER INSERT ON public.relationship_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_health_from_assessments();
-- Create table for couples streak tracking
CREATE TABLE public.couples_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_link_id UUID NOT NULL REFERENCES public.partner_links(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_activities_completed INTEGER NOT NULL DEFAULT 0,
  badges_earned TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.couples_streaks ENABLE ROW LEVEL SECURITY;

-- Partners can view their streak
CREATE POLICY "Partners can view their streak"
ON public.couples_streaks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_streaks.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can update their streak
CREATE POLICY "Partners can update their streak"
ON public.couples_streaks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_streaks.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Partners can insert their streak (only one per couple)
CREATE POLICY "Partners can insert their streak"
ON public.couples_streaks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partner_links pl
    WHERE pl.id = couples_streaks.partner_link_id
    AND (pl.user_id = auth.uid() OR pl.partner_id = auth.uid())
    AND pl.status = 'accepted'
  )
);

-- Create function to update streak when activity is completed
CREATE OR REPLACE FUNCTION public.update_couples_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_record couples_streaks%ROWTYPE;
  days_since_last INTEGER;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record
  FROM couples_streaks
  WHERE partner_link_id = NEW.partner_link_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO couples_streaks (partner_link_id, current_streak, last_activity_date, total_activities_completed)
    VALUES (NEW.partner_link_id, 1, CURRENT_DATE, 1);
  ELSE
    -- Calculate days since last activity
    IF streak_record.last_activity_date IS NULL THEN
      days_since_last := 999;
    ELSE
      days_since_last := CURRENT_DATE - streak_record.last_activity_date;
    END IF;

    IF days_since_last = 0 THEN
      -- Same day, just increment total
      UPDATE couples_streaks
      SET total_activities_completed = total_activities_completed + 1,
          updated_at = now()
      WHERE partner_link_id = NEW.partner_link_id;
    ELSIF days_since_last = 1 THEN
      -- Consecutive day, increment streak
      UPDATE couples_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = CURRENT_DATE,
          total_activities_completed = total_activities_completed + 1,
          updated_at = now()
      WHERE partner_link_id = NEW.partner_link_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE couples_streaks
      SET current_streak = 1,
          last_activity_date = CURRENT_DATE,
          total_activities_completed = total_activities_completed + 1,
          updated_at = now()
      WHERE partner_link_id = NEW.partner_link_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on completed_activities
CREATE TRIGGER update_streak_on_activity
AFTER INSERT ON public.completed_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_couples_streak();

-- Create trigger on completed_challenges
CREATE TRIGGER update_streak_on_challenge
AFTER INSERT ON public.completed_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_couples_streak();
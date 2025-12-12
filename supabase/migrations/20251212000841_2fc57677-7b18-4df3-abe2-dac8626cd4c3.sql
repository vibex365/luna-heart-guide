-- Create mood entries table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  mood_label TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own mood entries"
ON public.mood_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries"
ON public.mood_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
ON public.mood_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
ON public.mood_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_mood_entries_user_created ON public.mood_entries(user_id, created_at DESC);
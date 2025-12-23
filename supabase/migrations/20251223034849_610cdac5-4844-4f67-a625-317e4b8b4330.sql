-- Create ebooks table
CREATE TABLE public.ebooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL DEFAULT 'Luna AI',
  description text,
  cover_image text,
  category text NOT NULL DEFAULT 'relationships',
  chapters_count integer NOT NULL DEFAULT 0,
  estimated_read_time integer, -- in minutes
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create ebook chapters table
CREATE TABLE public.ebook_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  has_game boolean DEFAULT false,
  game_type text, -- 'quiz', 'reflection', 'exercise'
  game_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ebook_id, chapter_number)
);

-- Create user notes table
CREATE TABLE public.ebook_user_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chapter_id uuid NOT NULL REFERENCES public.ebook_chapters(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create reading progress table
CREATE TABLE public.ebook_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  current_chapter integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_chapters integer[] DEFAULT '{}'::integer[],
  last_read_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, ebook_id)
);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for ebooks (anyone can view active books)
CREATE POLICY "Anyone can view active ebooks" 
ON public.ebooks 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage ebooks" 
ON public.ebooks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for chapters (anyone can view)
CREATE POLICY "Anyone can view chapters" 
ON public.ebook_chapters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage chapters" 
ON public.ebook_chapters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user notes
CREATE POLICY "Users can view their own notes" 
ON public.ebook_user_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.ebook_user_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.ebook_user_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.ebook_user_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for progress
CREATE POLICY "Users can view their own progress" 
ON public.ebook_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.ebook_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.ebook_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_ebook_chapters_ebook_id ON public.ebook_chapters(ebook_id);
CREATE INDEX idx_ebook_user_notes_user_chapter ON public.ebook_user_notes(user_id, chapter_id);
CREATE INDEX idx_ebook_progress_user_id ON public.ebook_progress(user_id);
-- Create blog_posts table for storing AI-generated content
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'relationships',
  tags TEXT[] DEFAULT '{}',
  read_time_minutes INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  views_count INTEGER DEFAULT 0,
  ai_model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_topics table for AI generation queue
CREATE TABLE public.blog_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'relationships',
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_settings table for configuration
CREATE TABLE public.blog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

-- Blog posts: anyone can read published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- Admins can manage all blog posts
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Blog topics: admins only
CREATE POLICY "Admins can manage blog topics"
ON public.blog_topics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Blog settings: admins only
CREATE POLICY "Admins can manage blog settings"
ON public.blog_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions to insert/update blog posts (service role)
CREATE POLICY "Service role can manage blog posts"
ON public.blog_posts FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage blog topics"
ON public.blog_topics FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_topics_status ON public.blog_topics(status);
CREATE INDEX idx_blog_topics_priority ON public.blog_topics(priority DESC);

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_settings_updated_at
  BEFORE UPDATE ON public.blog_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.blog_settings (key, value, description) VALUES
('posts_per_day', '25', 'Number of posts to generate per day'),
('content_length', '"medium"', 'Preferred content length: short, medium, long'),
('auto_publish', 'true', 'Automatically publish generated posts'),
('categories', '["relationships", "communication", "trust", "dating", "marriage", "self-love", "breakups", "mental-health"]', 'Active categories for blog posts');

-- Pre-populate 100 SEO topics
INSERT INTO public.blog_topics (topic, keywords, category, priority) VALUES
('How to Stop Overthinking in a Relationship', ARRAY['overthinking', 'relationship anxiety', 'trust issues'], 'relationships', 10),
('Signs Your Partner is Emotionally Unavailable', ARRAY['emotional availability', 'relationship red flags', 'partner behavior'], 'relationships', 10),
('What to Do When Your Partner Won''t Communicate', ARRAY['communication issues', 'silent treatment', 'relationship problems'], 'communication', 10),
('How to Rebuild Trust After Lying', ARRAY['trust issues', 'lying in relationships', 'rebuilding trust'], 'trust', 10),
('Am I in a Toxic Relationship? 15 Warning Signs', ARRAY['toxic relationship', 'red flags', 'unhealthy relationship'], 'relationships', 10),
('How to Handle Jealousy in a Healthy Way', ARRAY['jealousy', 'insecurity', 'relationship jealousy'], 'trust', 9),
('When to Walk Away from a Relationship', ARRAY['ending relationship', 'breakup signs', 'leaving a relationship'], 'breakups', 9),
('How to Have Difficult Conversations with Your Partner', ARRAY['difficult conversations', 'relationship talks', 'communication skills'], 'communication', 9),
('Understanding the 5 Love Languages', ARRAY['love languages', 'expressing love', 'relationship needs'], 'relationships', 9),
('How to Deal with a Partner Who Has Trust Issues', ARRAY['trust issues', 'insecure partner', 'building trust'], 'trust', 9),
('Signs You''re Ready for a Serious Relationship', ARRAY['relationship readiness', 'commitment', 'dating to relationship'], 'dating', 8),
('How to Stop Being Clingy in a Relationship', ARRAY['clingy behavior', 'attachment', 'relationship independence'], 'self-love', 8),
('What is Gaslighting in Relationships?', ARRAY['gaslighting', 'emotional abuse', 'manipulation'], 'mental-health', 8),
('How to Apologize to Your Partner the Right Way', ARRAY['apology', 'making up', 'relationship repair'], 'communication', 8),
('Why Do I Push People Away? Understanding Your Patterns', ARRAY['avoidant attachment', 'pushing away', 'relationship patterns'], 'self-love', 8),
('How to Build Emotional Intimacy with Your Partner', ARRAY['emotional intimacy', 'connection', 'deeper bond'], 'relationships', 8),
('Signs Your Relationship is Moving Too Fast', ARRAY['relationship pace', 'moving too fast', 'love bombing'], 'dating', 7),
('How to Set Healthy Boundaries in Relationships', ARRAY['boundaries', 'healthy relationship', 'self-respect'], 'self-love', 7),
('Dealing with Anxiety in a New Relationship', ARRAY['relationship anxiety', 'new relationship', 'dating anxiety'], 'mental-health', 7),
('How to Recover from a Breakup', ARRAY['breakup recovery', 'moving on', 'heartbreak healing'], 'breakups', 7),
('What is Stonewalling and How to Deal with It', ARRAY['stonewalling', 'silent treatment', 'communication breakdown'], 'communication', 7),
('How to Know If Someone Really Loves You', ARRAY['signs of love', 'true love', 'relationship signs'], 'relationships', 7),
('Why Your Partner Keeps Bringing Up the Past', ARRAY['past issues', 'grudges', 'relationship arguments'], 'communication', 7),
('How to Stop Comparing Your Relationship to Others', ARRAY['comparison', 'social media relationships', 'relationship expectations'], 'self-love', 6),
('Signs of an Emotionally Abusive Relationship', ARRAY['emotional abuse', 'abusive relationship', 'toxic partner'], 'mental-health', 6),
('How to Maintain Your Independence in a Relationship', ARRAY['independence', 'codependency', 'healthy relationship'], 'self-love', 6),
('What to Do When You Feel Unappreciated in a Relationship', ARRAY['feeling unappreciated', 'relationship neglect', 'partner appreciation'], 'communication', 6),
('How to Forgive Your Partner After Cheating', ARRAY['cheating', 'infidelity', 'forgiveness'], 'trust', 6),
('Understanding Anxious Attachment Style', ARRAY['anxious attachment', 'attachment theory', 'relationship patterns'], 'mental-health', 6),
('How to Deal with a Narcissistic Partner', ARRAY['narcissist', 'narcissistic relationship', 'toxic partner'], 'mental-health', 6),
('Signs You''re in a One-Sided Relationship', ARRAY['one-sided relationship', 'unbalanced relationship', 'giving too much'], 'relationships', 6),
('How to Communicate Your Needs Without Starting a Fight', ARRAY['communication', 'expressing needs', 'avoiding arguments'], 'communication', 6),
('What is Trauma Bonding in Relationships?', ARRAY['trauma bonding', 'toxic attachment', 'abusive relationship'], 'mental-health', 5),
('How to Stop Being Insecure in Your Relationship', ARRAY['insecurity', 'self-esteem', 'relationship confidence'], 'self-love', 5),
('Signs Your Partner is Falling Out of Love', ARRAY['falling out of love', 'relationship ending', 'partner distance'], 'relationships', 5),
('How to Rekindle the Spark in a Long-Term Relationship', ARRAY['rekindle romance', 'long-term relationship', 'keeping love alive'], 'marriage', 5),
('Understanding Avoidant Attachment Style', ARRAY['avoidant attachment', 'fear of intimacy', 'attachment theory'], 'mental-health', 5),
('How to Deal with In-Laws Who Don''t Like You', ARRAY['in-laws', 'family conflict', 'marriage problems'], 'marriage', 5),
('Why Do I Attract Toxic Partners?', ARRAY['toxic relationships', 'dating patterns', 'relationship choices'], 'self-love', 5),
('How to Support a Partner with Depression', ARRAY['depression', 'mental health support', 'partner with depression'], 'mental-health', 5),
('Signs You''re Dating a Commitment-Phobe', ARRAY['commitment phobia', 'fear of commitment', 'avoidant partner'], 'dating', 5),
('How to Handle Long-Distance Relationships', ARRAY['long distance', 'LDR', 'distance relationship'], 'relationships', 5),
('What is Breadcrumbing and Are You a Victim?', ARRAY['breadcrumbing', 'dating games', 'mixed signals'], 'dating', 5),
('How to Stop Fighting About Money with Your Partner', ARRAY['money fights', 'financial disagreements', 'couples and money'], 'marriage', 5),
('Signs of a Healthy vs Unhealthy Relationship', ARRAY['healthy relationship', 'relationship comparison', 'relationship health'], 'relationships', 5),
('How to Heal from Childhood Trauma Affecting Your Relationships', ARRAY['childhood trauma', 'relationship patterns', 'healing'], 'mental-health', 4),
('Why You Should Never Ignore Red Flags in Dating', ARRAY['red flags', 'dating warning signs', 'relationship risks'], 'dating', 4),
('How to Ask Your Partner for More Affection', ARRAY['affection', 'physical touch', 'relationship needs'], 'communication', 4),
('What is Love Bombing and Why is It Dangerous?', ARRAY['love bombing', 'toxic dating', 'manipulation'], 'dating', 4),
('How to Survive a Breakup When You Still Love Them', ARRAY['breakup', 'still in love', 'moving on'], 'breakups', 4);
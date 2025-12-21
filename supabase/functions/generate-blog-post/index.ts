import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface BlogTopic {
  id: string;
  topic: string;
  keywords: string[];
  category: string;
}

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  category: string;
  tags: string[];
  read_time_minutes: number;
  faq: { question: string; answer: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-blog-post] Starting blog post generation...');
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get a pending topic from the queue
    const { data: topics, error: topicError } = await supabase
      .from('blog_topics')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (topicError) {
      console.error('[generate-blog-post] Error fetching topic:', topicError);
      throw topicError;
    }

    if (!topics || topics.length === 0) {
      console.log('[generate-blog-post] No pending topics, generating a new one...');
      // Generate a new topic if queue is empty
      const newTopic = await generateNewTopic(supabase);
      if (!newTopic) {
        return new Response(JSON.stringify({ error: 'No topics available' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      topics.push(newTopic);
    }

    const topic = topics[0] as BlogTopic;
    console.log('[generate-blog-post] Using topic:', topic.topic);

    // Mark topic as being used
    await supabase
      .from('blog_topics')
      .update({ status: 'processing', used_at: new Date().toISOString() })
      .eq('id', topic.id);

    // Generate the blog post using Lovable AI
    const generatedPost = await generateBlogPost(topic);
    
    if (!generatedPost) {
      // Mark topic as failed
      await supabase
        .from('blog_topics')
        .update({ status: 'failed' })
        .eq('id', topic.id);
      
      throw new Error('Failed to generate blog post');
    }

    // Save the blog post
    const { data: savedPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        title: generatedPost.title,
        slug: generatedPost.slug,
        excerpt: generatedPost.excerpt,
        content: generatedPost.content,
        meta_title: generatedPost.meta_title,
        meta_description: generatedPost.meta_description,
        keywords: generatedPost.keywords,
        category: generatedPost.category,
        tags: generatedPost.tags,
        read_time_minutes: generatedPost.read_time_minutes,
        status: 'published',
        published_at: new Date().toISOString(),
        ai_model_used: 'google/gemini-2.5-flash',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[generate-blog-post] Error saving post:', saveError);
      // Mark topic as failed
      await supabase
        .from('blog_topics')
        .update({ status: 'failed' })
        .eq('id', topic.id);
      throw saveError;
    }

    // Mark topic as used
    await supabase
      .from('blog_topics')
      .update({ status: 'used' })
      .eq('id', topic.id);

    console.log('[generate-blog-post] Successfully generated post:', savedPost.slug);

    return new Response(JSON.stringify({ 
      success: true, 
      post: {
        id: savedPost.id,
        title: savedPost.title,
        slug: savedPost.slug,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-blog-post] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateNewTopic(supabase: any): Promise<BlogTopic | null> {
  // Generate a fresh topic using AI
  const categories = ['relationships', 'communication', 'trust', 'dating', 'marriage', 'self-love', 'breakups', 'mental-health'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const prompt = `Generate a single unique SEO blog topic about ${randomCategory} for a relationship and mental health app called Luna.

The topic should:
1. Target a long-tail keyword that people actually search for
2. Be specific and actionable
3. Address a real problem people face

Return ONLY a JSON object with this exact format:
{
  "topic": "The blog post title",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "${randomCategory}"
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const topicData = JSON.parse(jsonMatch[0]);
    
    // Insert the new topic
    const { data: newTopic, error } = await supabase
      .from('blog_topics')
      .insert({
        topic: topicData.topic,
        keywords: topicData.keywords,
        category: topicData.category,
        status: 'pending',
        priority: 5,
      })
      .select()
      .single();

    if (error) {
      console.error('[generate-blog-post] Error creating new topic:', error);
      return null;
    }

    return newTopic;
  } catch (error) {
    console.error('[generate-blog-post] Error generating new topic:', error);
    return null;
  }
}

async function generateBlogPost(topic: BlogTopic): Promise<GeneratedPost | null> {
  const prompt = `You are an expert SEO content writer for Luna, an AI-powered relationship and mental health companion app. Write a comprehensive, engaging blog post about:

"${topic.topic}"

Target keywords: ${topic.keywords.join(', ')}
Category: ${topic.category}

REQUIREMENTS:
1. Write 1800-2500 words of high-quality, helpful content
2. Use a warm, empathetic, conversational tone
3. Include personal examples and relatable scenarios
4. Structure with clear H2 and H3 headings
5. Include an FAQ section with 3-4 questions
6. Naturally mention Luna as a helpful tool (but don't be salesy)
7. Use markdown formatting
8. Make it genuinely helpful for someone struggling with this issue

Return a JSON object with this EXACT structure:
{
  "title": "SEO-optimized title (max 60 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling excerpt (max 160 chars)",
  "content": "Full markdown content with ## and ### headings",
  "meta_title": "SEO meta title (max 60 chars)",
  "meta_description": "Meta description (max 155 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3"],
  "read_time_minutes": 8,
  "faq": [
    {"question": "FAQ question 1?", "answer": "Answer 1"},
    {"question": "FAQ question 2?", "answer": "Answer 2"},
    {"question": "FAQ question 3?", "answer": "Answer 3"}
  ]
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

  try {
    console.log('[generate-blog-post] Calling Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('[generate-blog-post] Lovable API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[generate-blog-post] No content in response');
      return null;
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generate-blog-post] Could not extract JSON from response');
      return null;
    }
    
    const postData = JSON.parse(jsonMatch[0]);
    
    // Generate unique slug with timestamp to avoid conflicts
    const baseSlug = postData.slug || topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    
    return {
      ...postData,
      slug: uniqueSlug,
      category: topic.category,
    };
  } catch (error) {
    console.error('[generate-blog-post] Error generating post:', error);
    return null;
  }
}

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

    // Generate the blog post using Lovable AI with tool calling
    const generatedPost = await generateBlogPost(topic);
    
    if (!generatedPost) {
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
  const categories = ['relationships', 'communication', 'trust', 'dating', 'marriage', 'self-love', 'breakups', 'mental-health'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const prompt = `Generate a unique SEO blog topic about ${randomCategory} for Luna, an AI relationship and mental health app. The topic should target a long-tail keyword, be specific, actionable, and address a real problem people face.`;

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
        tools: [{
          type: 'function',
          function: {
            name: 'create_blog_topic',
            description: 'Create a new blog topic with keywords',
            parameters: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'The blog post title/topic' },
                keywords: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'SEO keywords for this topic'
                },
                category: { type: 'string', description: 'The category of the post' }
              },
              required: ['topic', 'keywords', 'category'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_blog_topic' } }
      }),
    });

    if (!response.ok) {
      console.error('[generate-blog-post] Topic generation API error:', response.status);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('[generate-blog-post] No tool call in topic response');
      return null;
    }

    const topicData = JSON.parse(toolCall.function.arguments);
    
    const { data: newTopic, error } = await supabase
      .from('blog_topics')
      .insert({
        topic: topicData.topic,
        keywords: topicData.keywords,
        category: topicData.category || randomCategory,
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
4. Structure with clear H2 and H3 headings using markdown (## and ###)
5. Include an FAQ section at the end with 3-4 questions
6. Naturally mention Luna as a helpful tool (but don't be salesy)
7. Make it genuinely helpful for someone struggling with this issue`;

  try {
    console.log('[generate-blog-post] Calling Lovable AI with tool calling...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        tools: [{
          type: 'function',
          function: {
            name: 'create_blog_post',
            description: 'Create a complete blog post with all required fields',
            parameters: {
              type: 'object',
              properties: {
                title: { 
                  type: 'string', 
                  description: 'SEO-optimized title, max 60 characters' 
                },
                slug: { 
                  type: 'string', 
                  description: 'URL-friendly slug using only lowercase letters, numbers, and hyphens' 
                },
                excerpt: { 
                  type: 'string', 
                  description: 'Compelling excerpt, max 160 characters' 
                },
                content: { 
                  type: 'string', 
                  description: 'Full markdown content with ## and ### headings, 1800-2500 words' 
                },
                meta_title: { 
                  type: 'string', 
                  description: 'SEO meta title, max 60 characters' 
                },
                meta_description: { 
                  type: 'string', 
                  description: 'Meta description, max 155 characters' 
                },
                keywords: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: '5 SEO keywords'
                },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: '3 tags for the post'
                },
                read_time_minutes: { 
                  type: 'number', 
                  description: 'Estimated read time in minutes'
                }
              },
              required: ['title', 'slug', 'excerpt', 'content', 'meta_title', 'meta_description', 'keywords', 'tags', 'read_time_minutes'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_blog_post' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-blog-post] Lovable API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[generate-blog-post] API response received');
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('[generate-blog-post] No tool call in response:', JSON.stringify(data).substring(0, 500));
      return null;
    }

    const postData = JSON.parse(toolCall.function.arguments);
    console.log('[generate-blog-post] Parsed post data for:', postData.title);
    
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

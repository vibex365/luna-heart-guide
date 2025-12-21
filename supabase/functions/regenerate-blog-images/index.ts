import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all blog posts
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, category')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`[regenerate-blog-images] Found ${posts?.length || 0} posts to update`);

    const results: any[] = [];

    for (const post of posts || []) {
      try {
        console.log(`[regenerate-blog-images] Generating image for: ${post.title}`);
        
        // Create a prompt for a blog featured image with real people
        const imagePrompt = `Create a photorealistic, high-quality blog featured image for an article titled "${post.title}" in the ${post.category} category.
        
REQUIREMENTS:
- Feature real, diverse people (couples, individuals, or families depending on the topic)
- Natural, candid moments showing genuine emotion and connection
- Warm, inviting lighting with soft natural tones
- Modern, editorial photography style like you'd see in a lifestyle magazine
- People should reflect the emotional tone of the article (supportive, loving, contemplative, hopeful)
- Professional quality, sharp focus on faces and expressions
- 16:9 aspect ratio, landscape orientation
- NO text, logos, or watermarks on the image

The image should feel authentic and relatable, showing real human connection and emotion.`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              { role: 'user', content: imagePrompt }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[regenerate-blog-images] AI image error for ${post.slug}:`, errorText);
          results.push({ id: post.id, slug: post.slug, success: false, error: 'AI generation failed' });
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(`[regenerate-blog-images] No image in response for ${post.slug}`);
          results.push({ id: post.id, slug: post.slug, success: false, error: 'No image in response' });
          continue;
        }

        // Extract base64 data from data URL
        const base64Data = imageUrl.split(',')[1];
        if (!base64Data) {
          console.error(`[regenerate-blog-images] Invalid image data for ${post.slug}`);
          results.push({ id: post.id, slug: post.slug, success: false, error: 'Invalid image data' });
          continue;
        }

        // Decode base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to storage
        const fileName = `${post.slug}-new.png`;
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, bytes, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`[regenerate-blog-images] Upload error for ${post.slug}:`, uploadError);
          results.push({ id: post.id, slug: post.slug, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        // Update the blog post with the new image
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ featured_image: publicUrl })
          .eq('id', post.id);

        if (updateError) {
          console.error(`[regenerate-blog-images] Update error for ${post.slug}:`, updateError);
          results.push({ id: post.id, slug: post.slug, success: false, error: updateError.message });
          continue;
        }

        console.log(`[regenerate-blog-images] Successfully updated image for: ${post.title}`);
        results.push({ id: post.id, slug: post.slug, success: true, imageUrl: publicUrl });

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (postError) {
        console.error(`[regenerate-blog-images] Error processing ${post.slug}:`, postError);
        results.push({ id: post.id, slug: post.slug, success: false, error: String(postError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Regenerated ${successCount} images, ${failCount} failed`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[regenerate-blog-images] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

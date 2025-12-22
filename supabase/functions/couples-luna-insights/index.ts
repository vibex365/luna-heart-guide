import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COUPLES-LUNA-INSIGHTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { partnerLinkId, messages } = await req.json();

    if (!partnerLinkId || !messages || messages.length < 5) {
      throw new Error("Not enough conversation data");
    }

    // Verify user is part of this partner link
    const { data: partnerLink, error: plError } = await supabaseClient
      .from('partner_links')
      .select('*')
      .eq('id', partnerLinkId)
      .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
      .single();

    if (plError || !partnerLink) {
      throw new Error("Partner link not found");
    }

    // Get partner names
    const partnerId = partnerLink.user_id === userId ? partnerLink.partner_id : partnerLink.user_id;
    
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', [userId, partnerId]);

    const userName = profiles?.find(p => p.user_id === userId)?.display_name || 'Partner 1';
    const partnerName = profiles?.find(p => p.user_id === partnerId)?.display_name || 'Partner 2';

    logStep("Generating insights", { messageCount: messages.length, userName, partnerName });

    // Format conversation for AI
    const conversationText = messages.map((msg: any) => {
      const speaker = msg.role === 'assistant' ? 'Luna' : 
        (msg.user_id === userId ? userName : partnerName);
      return `${speaker}: ${msg.content}`;
    }).join('\n');

    // Call Lovable AI for insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert relationship counselor analyzing a couple's conversation with an AI companion named Luna.

Your task is to provide insightful, encouraging observations about:
1. Communication patterns between the couple
2. Emotional themes and how they're connecting
3. Growth opportunities or positive moments
4. Topics they're exploring together

Be warm, supportive, and specific. Reference actual topics discussed. Keep response to 2-3 sentences maximum.

Also identify:
- The overall sentiment (one word: positive, loving, playful, supportive, neutral, or challenging)
- 2-4 key topics discussed (short phrases)

Format your response as JSON:
{
  "insight": "Your insight here",
  "sentiment": "sentiment_word",
  "topics": ["topic1", "topic2"]
}`
          },
          {
            role: "user",
            content: `Analyze this conversation between ${userName}, ${partnerName}, and Luna:\n\n${conversationText}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI error", { status: aiResponse.status, error: errorText });
      throw new Error("Failed to generate insights");
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;
    
    logStep("AI response received", { responseLength: responseContent?.length });

    // Parse AI response
    let insight = "Your conversations show genuine connection and care for each other.";
    let sentiment = "positive";
    let topics: string[] = [];

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(responseContent);
      insight = parsed.insight || insight;
      sentiment = parsed.sentiment || sentiment;
      topics = parsed.topics || [];
    } catch {
      // If not JSON, use the raw response
      insight = responseContent || insight;
    }

    // Save insight to database
    const { data: savedInsight, error: saveError } = await supabaseClient
      .from('couples_luna_insights')
      .insert({
        partner_link_id: partnerLinkId,
        generated_by: userId,
        insight_type: 'conversation_summary',
        content: insight,
        message_count: messages.length,
        key_topics: topics,
        sentiment: sentiment
      })
      .select()
      .single();

    if (saveError) {
      logStep("Error saving insight", { error: saveError });
      throw new Error("Failed to save insight");
    }

    logStep("Insight saved successfully", { insightId: savedInsight.id });

    return new Response(JSON.stringify({
      success: true,
      insight: savedInsight
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

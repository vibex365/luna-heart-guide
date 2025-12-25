import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-ARGUMENT] ${step}${detailsStr}`);
};

const ANALYSIS_PROMPT = `You are a compassionate relationship therapist analyzing a conversation or argument between partners. Your goal is to provide balanced, non-judgmental insights that help both partners grow.

Analyze the conversation and provide:

1. **Clarity of Points** (1-10): How clearly did each person express their perspective?
2. **Emotional Awareness** (1-10): How well did each person acknowledge their own and their partner's emotions?
3. **Listening Quality** (1-10): How well did each person listen and respond to the other?
4. **Resolution Focus** (1-10): How focused were they on finding solutions vs. winning?

For each dimension, provide:
- A score
- A brief example from the conversation
- An improvement tip

Also provide:
- A summary of the main issues discussed
- Key patterns you noticed (both positive and areas for growth)
- 2-3 specific action items for moving forward

Respond in JSON format:
{
  "summary": "Brief summary of the discussion",
  "scores": {
    "clarity": { "score": 7, "example": "...", "tip": "..." },
    "emotional_awareness": { "score": 6, "example": "...", "tip": "..." },
    "listening": { "score": 5, "example": "...", "tip": "..." },
    "resolution_focus": { "score": 8, "example": "...", "tip": "..." }
  },
  "patterns": {
    "positive": ["Pattern 1", "Pattern 2"],
    "growth_areas": ["Area 1", "Area 2"]
  },
  "action_items": [
    { "title": "Action 1", "description": "..." },
    { "title": "Action 2", "description": "..." }
  ],
  "overall_score": 6.5
}`;

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

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { analysisId, transcript } = await req.json();
    logStep("Request params", { analysisId, hasTranscript: !!transcript });

    if (!analysisId) {
      throw new Error("Analysis ID is required");
    }

    // Update status to analyzing
    await supabaseClient
      .from('argument_analyses')
      .update({ status: 'analyzing' })
      .eq('id', analysisId);

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logStep("Calling AI for analysis");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: `Here is the conversation to analyze:\n\n${transcript}` }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisContent = aiData.choices?.[0]?.message?.content;
    
    logStep("AI response received", { hasContent: !!analysisContent });

    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      logStep("Failed to parse AI response as JSON", { content: analysisContent });
      throw new Error("Failed to parse analysis");
    }

    // Update the analysis record
    const { error: updateError } = await supabaseClient
      .from('argument_analyses')
      .update({
        transcript,
        analysis,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId);

    if (updateError) {
      logStep("Error updating analysis", { error: updateError });
      throw new Error("Failed to save analysis");
    }

    logStep("Analysis completed successfully", { analysisId });

    return new Response(JSON.stringify({ 
      success: true,
      analysis 
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

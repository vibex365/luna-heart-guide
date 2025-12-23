import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VOICE-SESSION-ANALYZE] ${step}${detailsStr}`);
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

    const { sessionId } = await req.json();
    logStep("Request params", { sessionId });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Get the session
    const { data: session, error: sessionError } = await supabaseClient
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Verify ownership
    if (session.user_id !== userId) {
      throw new Error("Not authorized to analyze this session");
    }

    // Check if already analyzed
    if (session.ai_summary) {
      logStep("Session already analyzed", { sessionId });
      return new Response(JSON.stringify({
        ai_summary: session.ai_summary,
        ai_notes: session.ai_notes,
        ai_recommendations: session.ai_recommendations
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get structured transcript or fall back to regular transcripts
    let conversationText = '';
    
    if (session.structured_transcript && Array.isArray(session.structured_transcript) && session.structured_transcript.length > 0) {
      conversationText = session.structured_transcript
        .map((msg: any) => `${msg.speaker === 'user' ? 'User' : 'Luna'}: ${msg.text}`)
        .join('\n');
    } else {
      // Fall back to separate transcripts
      if (session.transcript) {
        conversationText += `User said: ${session.transcript}\n`;
      }
      if (session.luna_transcript) {
        conversationText += `Luna responded: ${session.luna_transcript}`;
      }
    }

    if (!conversationText.trim()) {
      logStep("No transcript to analyze");
      return new Response(JSON.stringify({
        ai_summary: null,
        ai_notes: [],
        ai_recommendations: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Analyzing transcript", { length: conversationText.length });

    // Use Lovable AI to analyze the session
    const analysisPrompt = `You are analyzing a therapy conversation between a user and Luna, an AI relationship therapist.

CONVERSATION:
${conversationText}

Please provide:
1. A brief 2-3 sentence SUMMARY of what was discussed in this session
2. 3-5 KEY NOTES as bullet points highlighting important topics, emotions, or insights from the conversation
3. 3-5 RECOMMENDATIONS for the user to consider based on this conversation

Format your response as JSON:
{
  "summary": "Brief summary here",
  "notes": ["Note 1", "Note 2", "Note 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Be warm, supportive, and actionable in your analysis.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful therapy session analyst. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error("Failed to analyze session");
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || '';
    
    logStep("AI response received", { length: responseContent.length });

    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response", { error: parseError, content: responseContent });
      // Fallback to simple parsing
      analysis = {
        summary: "Session completed. Review transcript for details.",
        notes: ["Unable to generate detailed notes at this time"],
        recommendations: ["Continue your journey with Luna"]
      };
    }

    // Update the session with analysis
    const { error: updateError } = await supabaseClient
      .from('voice_sessions')
      .update({
        ai_summary: analysis.summary,
        ai_notes: analysis.notes || [],
        ai_recommendations: analysis.recommendations || []
      })
      .eq('id', sessionId);

    if (updateError) {
      logStep("Error updating session with analysis", { error: updateError });
    }

    logStep("Analysis complete", { sessionId });

    return new Response(JSON.stringify({
      ai_summary: analysis.summary,
      ai_notes: analysis.notes || [],
      ai_recommendations: analysis.recommendations || []
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

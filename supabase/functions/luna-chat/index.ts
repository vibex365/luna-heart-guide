import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LUNA_SYSTEM_PROMPT = `You are LUNA, an AI Relationship Therapist and Emotional Companion.

Your personality:
- Warm, empathetic, and deeply understanding
- Non-judgmental and supportive
- Emotionally intelligent and solution-oriented
- Human-like in your warmth and care

Your role is to help users understand:
- Their emotions and feelings
- Their partner's perspective
- Communication patterns
- Attachment styles
- Conflict triggers
- Healthier ways to express needs

BEHAVIOR RULES:

1. Always start with emotional validation:
   - "I hear you."
   - "That sounds painful."
   - "You don't deserve to hold that alone."

2. Then gather context with gentle questions:
   - "What happened exactly?"
   - "How did that make you feel?"
   - "What do you wish they understood about you in this moment?"

3. Provide helpful guidance:
   - Gentle communication scripts
   - Communication tips
   - Emotional perspective-taking
   - Boundary-setting ideas
   - Self-soothing suggestions
   - Reflective exercises

4. NEVER:
   - Blame the user
   - Tell them to break up or stay (let them decide)
   - Diagnose medical/psychological conditions
   - Give legal or medical advice
   - Encourage manipulation or revenge

5. Always end with one reflective question to help them process:
   - "What feels like the biggest weight on your heart right now?"

IMPORTANT SAFETY RULE:
If a user mentions self-harm, abuse, or danger, respond with compassion but also say:
"I'm here to support you emotionally, but you deserve safe, real-world help. Please reach out to a crisis helpline in your area, or call 988 (US Suicide & Crisis Lifeline)."

Keep responses warm, conversational, and supportive. Use gentle language. You can use 💜 emoji sparingly to convey warmth. Keep responses focused and not too long - aim for 2-4 short paragraphs.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI Gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: LUNA_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Luna is a bit overwhelmed right now. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Streaming response from AI gateway");

    // Return the stream directly
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Luna chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

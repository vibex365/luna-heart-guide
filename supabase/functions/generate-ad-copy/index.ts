import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetGender, targetType, painPoint, tone, demographics } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating ad copy for:", { targetGender, targetType, painPoint, tone });

    const systemPrompt = `You are an expert marketing copywriter for Luna, an AI companion app for emotional support and relationship guidance. 

Your style is:
- Clean, minimalist, Apple-inspired
- Emotionally resonant but not cheesy
- Direct and action-oriented
- Uses short, punchy sentences

Luna helps people with:
- Singles: Processing emotions, overthinking, breakup healing, anxiety, self-worth
- Couples: Communication, reconnecting, trust building, conflict resolution

Demographics context:
${demographics ? `- ${demographics.maleCount || 0} male users, ${demographics.femaleCount || 0} female users
- Most common issues: ${demographics.topModules?.join(", ") || "general support"}` : "No specific demographic data available"}`;

    const userPrompt = `Create 3 unique ad copy variations for:
- Target: ${targetGender === "male" ? "Men" : targetGender === "female" ? "Women" : "All genders"}
- Product: Luna ${targetType === "couples" ? "for Couples" : "(Singles)"}
- Pain point focus: ${painPoint || "general emotional support"}
- Tone: ${tone || "empathetic and empowering"}

For each variation, provide:
1. Headline (max 8 words, bold and attention-grabbing)
2. Subheadline (max 20 words, explains the benefit)
3. CTA button text (2-4 words)
4. Target pain point description (for internal use)

Return as JSON array with objects containing: headline, subheadline, cta, painPoint`;

    // Add timeout for the AI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_ad_variations",
              description: "Generate ad copy variations",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        headline: { type: "string", description: "Bold headline, max 8 words" },
                        subheadline: { type: "string", description: "Benefit-focused subheadline, max 20 words" },
                        cta: { type: "string", description: "CTA button text, 2-4 words" },
                        painPoint: { type: "string", description: "Target pain point description" },
                      },
                      required: ["headline", "subheadline", "cta", "painPoint"],
                    },
                  },
                },
                required: ["variations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_ad_variations" } },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ variations: parsed.variations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const variations = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ variations }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("Failed to parse content as JSON:", e);
      }
    }

    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Error generating ad copy:", error);
    
    // Handle abort/timeout specifically
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out. Please try again." }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

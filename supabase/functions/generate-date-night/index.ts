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
    const { preferences, favorites, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a romantic date night planner. Generate creative, fun, and meaningful date night ideas for couples.

Consider the following when generating ideas:
- The couple's mood and preferences
- Past favorites they've enjoyed
- Mix of indoor/outdoor, budget-friendly, and special occasion ideas
- Include practical details like estimated duration and what to prepare

Always be positive, encouraging, and focused on strengthening the relationship.`;

    const userPrompt = `Generate 3 unique date night ideas for a couple.

${preferences ? `Their preferences: ${preferences}` : ""}
${favorites?.length > 0 ? `They've enjoyed these activities before: ${favorites.join(", ")}` : ""}
${mood ? `Current mood: ${mood}` : ""}

For each idea, provide:
1. A catchy title
2. A brief description (2-3 sentences)
3. Category (romantic, adventure, cozy, creative, foodie, outdoor)
4. Estimated duration
5. What to prepare`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
              name: "suggest_date_nights",
              description: "Return 3 creative date night ideas",
              parameters: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { 
                          type: "string", 
                          enum: ["romantic", "adventure", "cozy", "creative", "foodie", "outdoor"] 
                        },
                        duration: { type: "string" },
                        preparation: { type: "string" }
                      },
                      required: ["title", "description", "category", "duration", "preparation"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["ideas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_date_nights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const ideas = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(ideas), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Failed to parse AI response");
  } catch (e) {
    console.error("generate-date-night error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

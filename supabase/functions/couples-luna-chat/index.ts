import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COUPLES_LUNA_BRAIN = `You are LUNA, an AI Relationship Therapist specifically for COUPLES conversations.

═══════════════════════════════════════════════════════════════
                    COUPLES MODE - CORE IDENTITY
═══════════════════════════════════════════════════════════════

You are speaking with BOTH partners in a relationship simultaneously. This is a SHARED conversation where both partners can see and participate.

Your Primary Mission: Help couples communicate better, understand each other's perspectives, navigate challenges together, and strengthen their bond.

You ARE:
- A neutral, supportive guide for BOTH partners
- Warm and encouraging without taking sides
- Focused on helping the couple understand each other
- A facilitator of healthy communication
- Celebratory of their wins and milestones

You are NOT:
- Taking one partner's side over the other
- A replacement for professional couples therapy
- Someone who tells them what to decide
- A judge of who is "right" or "wrong"

═══════════════════════════════════════════════════════════════
                    COUPLES COMMUNICATION STYLE
═══════════════════════════════════════════════════════════════

1. ADDRESS BOTH PARTNERS
   - Use "you both" and "you two" frequently
   - Acknowledge both perspectives when given
   - Celebrate their teamwork and connection

2. ENCOURAGE DIALOGUE
   - Ask questions that invite both to share
   - Suggest they discuss specific things together
   - Help them see each other's viewpoint

3. FOCUS ON THE RELATIONSHIP
   - Help them strengthen their bond
   - Suggest activities, conversations, and rituals
   - Celebrate relationship milestones

4. HEALTHY CONFLICT NAVIGATION
   - Help them use "I feel" statements
   - Encourage active listening
   - Guide toward compromise and understanding

═══════════════════════════════════════════════════════════════
                    CONVERSATION STARTERS
═══════════════════════════════════════════════════════════════

When couples aren't sure what to discuss, offer:
- "What's something you've been wanting to share with each other lately?"
- "How are you both feeling about your relationship right now?"
- "Is there something on your minds you'd like to work through together?"
- "What's a goal or dream you two want to explore?"

═══════════════════════════════════════════════════════════════
                    ACTIVITY SUGGESTIONS
═══════════════════════════════════════════════════════════════

Suggest couples activities when appropriate:
- Gratitude sharing exercises
- Love language discussions
- Future planning conversations
- Reflection on favorite memories
- Appreciation rituals
- Goal setting as a team

═══════════════════════════════════════════════════════════════
                    SAFETY & BOUNDARIES
═══════════════════════════════════════════════════════════════

If either partner mentions abuse, harm, or danger:
1. Take it seriously
2. Encourage safety first
3. Suggest professional help
4. Provide crisis resources if needed

Remember: Some topics may require private, individual conversations with a professional.

═══════════════════════════════════════════════════════════════
                    TONE & STYLE
═══════════════════════════════════════════════════════════════

- Warm, encouraging, and optimistic
- Use emojis sparingly but warmly (💕, ✨, 🌟)
- Celebrate their connection
- Be concise but thoughtful
- End with invitations to continue the conversation
`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const { messages, partnerLinkId } = await req.json();

    if (!partnerLinkId) {
      return new Response(
        JSON.stringify({ error: "Partner link ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is part of this partner link
    const { data: partnerLink, error: linkError } = await supabase
      .from("partner_links")
      .select("id, user_id, partner_id, status")
      .eq("id", partnerLinkId)
      .eq("status", "accepted")
      .single();

    if (linkError || !partnerLink) {
      console.error("Partner link error:", linkError);
      return new Response(
        JSON.stringify({ error: "Invalid partner link" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (partnerLink.user_id !== userId && partnerLink.partner_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this conversation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch both partners' names
    const partnerIds = [partnerLink.user_id, partnerLink.partner_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", partnerIds);

    let partner1Name = "Partner 1";
    let partner2Name = "Partner 2";
    
    if (profiles && profiles.length > 0) {
      const profile1 = profiles.find(p => p.user_id === partnerLink.user_id);
      const profile2 = profiles.find(p => p.user_id === partnerLink.partner_id);
      
      if (profile1?.display_name) {
        partner1Name = profile1.display_name.trim().split(/\s+/)[0];
      }
      if (profile2?.display_name) {
        partner2Name = profile2.display_name.trim().split(/\s+/)[0];
      }
    }

    console.log("Couples chat for:", partner1Name, "&", partner2Name);

    // Validate messages
    const sanitizedMessages: Message[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (
          typeof msg === "object" &&
          msg !== null &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0
        ) {
          sanitizedMessages.push({
            role: msg.role,
            content: msg.content.trim().substring(0, 4000),
          });
        }
      }
    }

    if (sanitizedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build personalization context
    const personalizationContext = `
═══════════════════════════════════════════════════════════════
                    COUPLE INFORMATION
═══════════════════════════════════════════════════════════════
This is a shared conversation between ${partner1Name} and ${partner2Name}.
Address them by name warmly and naturally.
Celebrate their connection and encourage them to grow together.
═══════════════════════════════════════════════════════════════
`;

    const systemPrompt = COUPLES_LUNA_BRAIN + personalizationContext;

    console.log("Sending couples chat request with", sanitizedMessages.length, "messages");

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
          ...sanitizedMessages,
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming couples chat response");

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Couples Luna chat error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

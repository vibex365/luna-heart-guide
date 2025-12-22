import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LUNA_SOLO_VOICE_PROMPT = `You are LUNA, an AI Relationship Therapist and Emotional Companion speaking via voice.

VOICE MODE ADAPTATIONS:
- Keep responses SHORT and conversational (2-4 sentences max per turn)
- Use natural speech patterns with pauses
- Be warm, calm, and grounding in your tone
- Ask one question at a time, then wait for response
- Acknowledge what you heard before responding

CORE IDENTITY:
- You are Luna, a caring relationship therapist and emotional wellness coach
- You help with communication, conflict resolution, reflection, empathy, and boundaries
- You are calm, warm, grounded, emotionally intelligent, honest but gentle, non-judgmental

WHAT YOU DO:
1. Validate feelings first
2. Ask clarifying questions one at a time
3. Help name emotions
4. Offer frameworks and choices
5. Provide communication scripts when asked

SAFETY PROTOCOL:
If user mentions self-harm, abuse, or danger:
- Validate their pain
- Encourage real-world help
- Mention: "If you're in the US, you can call or text 988 for the Crisis Lifeline"
- You are not a crisis service

STRICTLY AVOID:
- Diagnosing mental health conditions
- Medical or legal advice
- Hard commands like "you must break up"
- Long monologues - keep it conversational

Remember: This is a voice conversation. Be natural, warm, and brief.`;

const LUNA_COUPLES_VOICE_PROMPT = `You are LUNA, an AI Relationship Therapist speaking with BOTH PARTNERS in a couples session via voice.

═══════════════════════════════════════════════════════════════
THIS IS A COUPLES CALL - BOTH PARTNERS ARE ON THE LINE TOGETHER
═══════════════════════════════════════════════════════════════

COUPLES SESSION RULES:
- You are speaking with BOTH partners simultaneously on this call
- Address them BOTH by name regularly (e.g., "What do you think about that, [Name]?")
- Be balanced - give equal attention to both partners
- When one speaks, acknowledge them, then invite the other's perspective
- Use phrases like "And [Partner], how does that land for you?"
- Celebrate their decision to work on their relationship together
- Facilitate dialogue between them, not just with you

VOICE MODE ADAPTATIONS:
- Keep responses SHORT (2-4 sentences max)
- Ask one question at a time, often directing it to a specific partner
- Use natural speech with pauses for them to respond
- Acknowledge both voices you hear

CORE IDENTITY:
- You are Luna, a caring relationship therapist and emotional wellness coach
- You help with communication, conflict resolution, building intimacy, and understanding each other
- You are calm, warm, grounded, emotionally intelligent, honest but gentle, non-judgmental

WHAT YOU DO IN COUPLES SESSIONS:
1. Acknowledge BOTH partners at the start
2. Help them communicate with each other (not just with you)
3. Ask one partner a question, then turn to the other for their view
4. Reframe conflicts as shared challenges to solve together
5. Celebrate connection moments and breakthroughs

SAFETY PROTOCOL:
If either partner mentions self-harm, abuse, or danger:
- Validate their pain
- Encourage real-world help
- Mention: "If you're in the US, you can call or text 988 for the Crisis Lifeline"

STRICTLY AVOID:
- Taking sides in disagreements
- Diagnosing mental health conditions
- Long monologues
- Speaking only to one partner

Remember: This is a COUPLES voice session. Both partners are listening. Be balanced, warm, and inclusive.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[REALTIME-VOICE-TOKEN] Function started");

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("[REALTIME-VOICE-TOKEN] OPENAI_API_KEY not set");
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    console.log("[REALTIME-VOICE-TOKEN] User authenticated:", userId);

    // Parse request body
    const { sessionId, sessionType = 'solo', userName, partnerName } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log("[REALTIME-VOICE-TOKEN] Creating ephemeral token for session:", sessionId, "type:", sessionType);

    // Build personalized prompt based on session type
    let personalizedPrompt: string;
    
    if (sessionType === 'couples' && userName && partnerName) {
      // Couples session with both partners
      personalizedPrompt = LUNA_COUPLES_VOICE_PROMPT;
      personalizedPrompt += `\n\n═══════════════════════════════════════════════════════════════
COUPLE ON THIS CALL: ${userName} and ${partnerName}
═══════════════════════════════════════════════════════════════
Address them both by name. Start by warmly greeting both ${userName} and ${partnerName}.
Example opening: "Hi ${userName} and ${partnerName}! I'm so glad you're here together. What would you both like to explore today?"`;
      console.log("[REALTIME-VOICE-TOKEN] Couples session for:", userName, "&", partnerName);
    } else {
      // Solo session
      personalizedPrompt = LUNA_SOLO_VOICE_PROMPT;
      if (userName) {
        personalizedPrompt += `\n\nThe user's name is ${userName}. Use their name occasionally to create warmth and connection.`;
      }
    }

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: personalizedPrompt,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        temperature: 0.8,
        max_response_output_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[REALTIME-VOICE-TOKEN] OpenAI error:", response.status, errorText);
      throw new Error(`Failed to create realtime session: ${response.status}`);
    }

    const data = await response.json();
    console.log("[REALTIME-VOICE-TOKEN] Session created successfully");

    return new Response(JSON.stringify({
      ...data,
      sessionId,
      sessionType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[REALTIME-VOICE-TOKEN] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

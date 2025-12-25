import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COIN_COST = 5;

const MESSAGE_PROMPTS: Record<string, string> = {
  morning: "Generate a sweet, romantic good morning message that someone would send to their partner. The message should be warm, loving, and set a positive tone for the day. Keep it under 160 characters for SMS.",
  midday: "Generate a sweet midday/afternoon message that someone would send to their partner. It should express love and thinking of them. Keep it under 160 characters for SMS.",
  evening: "Generate a romantic evening message that someone would send to their partner. It should be warm and intimate, expressing love and looking forward to being together. Keep it under 160 characters for SMS.",
  sweet: "Generate a very sweet and romantic love message that expresses deep affection. Keep it under 160 characters for SMS.",
  flirty: "Generate a playful and flirty message that someone would send to their partner. Keep it tasteful but fun and teasing. Keep it under 160 characters for SMS.",
  supportive: "Generate a supportive and encouraging message for a partner going through their day. Express belief in them and care. Keep it under 160 characters for SMS.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[SEND-LOVE-MESSAGE] Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    console.log("[SEND-LOVE-MESSAGE] User authenticated:", user.id);

    const { messageType, customMessage, partnerLinkId } = await req.json();
    console.log("[SEND-LOVE-MESSAGE] Request:", { messageType, partnerLinkId, hasCustom: !!customMessage });

    // Get partner link and partner's phone
    const { data: partnerLink, error: linkError } = await supabaseClient
      .from("partner_links")
      .select("user_id, partner_id")
      .eq("id", partnerLinkId)
      .eq("status", "accepted")
      .single();

    if (linkError || !partnerLink) {
      throw new Error("Partner link not found");
    }

    // Determine which user is the partner
    const partnerId = partnerLink.user_id === user.id ? partnerLink.partner_id : partnerLink.user_id;

    // Get partner's phone number
    const { data: partnerProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("phone_number, display_name")
      .eq("user_id", partnerId)
      .single();

    if (profileError || !partnerProfile?.phone_number) {
      throw new Error("Partner doesn't have a phone number set up");
    }

    // Get sender's name
    const { data: senderProfile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const senderName = senderProfile?.display_name || "Your love";

    // Check user's coin balance
    const { data: coinData, error: coinError } = await supabaseClient
      .from("coin_transactions")
      .select("amount")
      .eq("user_id", user.id);

    if (coinError) throw new Error("Failed to check coin balance");

    const balance = coinData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    console.log("[SEND-LOVE-MESSAGE] User balance:", balance);

    if (balance < COIN_COST) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient coins", 
          required: COIN_COST, 
          balance 
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate message with AI if no custom message
    let messageToSend = customMessage;
    
    if (!customMessage && messageType) {
      const prompt = MESSAGE_PROMPTS[messageType] || MESSAGE_PROMPTS.sweet;
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: "You are Luna, a romantic AI assistant. Generate heartfelt messages. Only output the message itself, no quotes or explanations. The message should feel personal and genuine."
            },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("[SEND-LOVE-MESSAGE] AI error:", errorText);
        
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error("Failed to generate message");
      }

      const aiData = await aiResponse.json();
      messageToSend = aiData.choices?.[0]?.message?.content?.trim();
      console.log("[SEND-LOVE-MESSAGE] Generated message:", messageToSend);
    }

    if (!messageToSend) {
      throw new Error("No message to send");
    }

    // Add signature
    const finalMessage = `${messageToSend}\n\n- ${senderName} 💕`;

    // Send SMS via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error("SMS service not configured");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: partnerProfile.phone_number,
        From: twilioPhone,
        Body: finalMessage,
      }),
    });

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error("[SEND-LOVE-MESSAGE] Twilio error:", errorText);
      throw new Error("Failed to send SMS");
    }

    console.log("[SEND-LOVE-MESSAGE] SMS sent successfully");

    // Deduct coins
    const { error: deductError } = await supabaseClient
      .from("coin_transactions")
      .insert({
        user_id: user.id,
        amount: -COIN_COST,
        transaction_type: "love_message",
        description: `Sent love message to partner (${messageType || "custom"})`,
      });

    if (deductError) {
      console.error("[SEND-LOVE-MESSAGE] Failed to deduct coins:", deductError);
    }

    // Log the sent message
    const { error: logError } = await supabaseClient
      .from("couples_messages")
      .insert({
        partner_link_id: partnerLinkId,
        sender_id: user.id,
        message_type: "love_sms",
        content: `💌 SMS sent: ${messageToSend}`,
      });

    if (logError) {
      console.error("[SEND-LOVE-MESSAGE] Failed to log message:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: messageToSend,
        coinsUsed: COIN_COST,
        newBalance: balance - COIN_COST
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SEND-LOVE-MESSAGE] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

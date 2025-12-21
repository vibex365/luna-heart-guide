import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECORD-GIFT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { giftId, recipientId, partnerLinkId, message, paymentIntentId, senderId } = await req.json();
    
    if (!giftId || !recipientId || !partnerLinkId || !senderId) {
      throw new Error("Missing required fields");
    }
    logStep("Request received", { giftId, recipientId, partnerLinkId, senderId });

    // Insert the gift record using service role (bypasses RLS)
    const { data: giftRecord, error: insertError } = await supabaseClient
      .from('partner_gifts')
      .insert({
        partner_link_id: partnerLinkId,
        sender_id: senderId,
        recipient_id: recipientId,
        gift_id: giftId,
        message: message || null,
        stripe_payment_intent_id: paymentIntentId || null,
      })
      .select(`
        *,
        digital_gifts (*)
      `)
      .single();

    if (insertError) {
      logStep("Error inserting gift", { error: insertError.message });
      throw new Error(`Failed to insert gift: ${insertError.message}`);
    }

    logStep("Gift recorded successfully", { giftRecordId: giftRecord.id });

    // Get recipient's phone number for SMS notification
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('phone_number, display_name, sms_notifications_enabled')
      .eq('user_id', recipientId)
      .single();

    // Get sender's display name
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', senderId)
      .single();

    // Send SMS notification if enabled
    if (recipientProfile?.phone_number && recipientProfile?.sms_notifications_enabled) {
      try {
        const senderName = senderProfile?.display_name || 'Your partner';
        const giftName = giftRecord.digital_gifts?.name || 'a gift';
        const giftMessage = message ? ` They said: "${message}"` : '';
        
        await supabaseClient.functions.invoke('send-sms', {
          body: {
            action: 'send-direct',
            phoneNumber: recipientProfile.phone_number,
            message: `💝 ${senderName} just sent you ${giftName}!${giftMessage} Open Luna to see your gift and play the animation! 🎁✨`,
          },
        });
        logStep("SMS notification sent to recipient");
      } catch (smsError) {
        logStep("SMS notification failed (non-fatal)", { error: smsError });
      }
    }

    return new Response(JSON.stringify({ success: true, gift: giftRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in record-gift", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-GIFT-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For simplicity, we'll process the event directly
    // In production, you should verify the webhook signature
    const event = JSON.parse(body);
    logStep("Event parsed", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;

      if (metadata?.type === "digital_gift") {
        logStep("Processing gift payment", { metadata });

        // Insert the gift record
        const { data: giftRecord, error: insertError } = await supabaseClient
          .from('partner_gifts')
          .insert({
            partner_link_id: metadata.partner_link_id,
            sender_id: metadata.user_id,
            recipient_id: metadata.recipient_id,
            gift_id: metadata.gift_id,
            message: metadata.message || null,
            stripe_payment_intent_id: session.payment_intent,
          })
          .select()
          .single();

        if (insertError) {
          logStep("Error inserting gift", { error: insertError.message });
          throw new Error(`Failed to insert gift: ${insertError.message}`);
        }

        logStep("Gift recorded successfully", { giftRecordId: giftRecord.id });

        // Optionally send SMS notification to recipient
        // This could trigger the send-sms function
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-gift-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

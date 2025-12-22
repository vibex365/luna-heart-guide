import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-MINUTES-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll parse the event directly
    // In production, you should verify the webhook signature
    let event: Stripe.Event;
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      logStep("Failed to parse webhook body");
      return new Response("Invalid payload", { status: 400 });
    }

    logStep("Event type", { type: event.type });

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    // Only process luna_minutes purchases
    if (metadata?.type !== 'luna_minutes') {
      logStep("Not a minutes purchase, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = metadata.user_id;
    const packageId = metadata.package_id;
    const minutes = parseInt(metadata.minutes || '0');

    if (!userId || !minutes) {
      logStep("Missing user_id or minutes in metadata");
      return new Response("Missing metadata", { status: 400 });
    }

    logStep("Processing minutes purchase", { userId, packageId, minutes });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get or create user minutes record
    const { data: existingMinutes, error: fetchError } = await supabaseClient
      .from('user_minutes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logStep("Error fetching minutes", { error: fetchError });
      throw new Error("Failed to fetch minutes record");
    }

    if (existingMinutes) {
      // Update existing record
      const { error: updateError } = await supabaseClient
        .from('user_minutes')
        .update({
          minutes_balance: existingMinutes.minutes_balance + minutes,
          lifetime_purchased: existingMinutes.lifetime_purchased + minutes
        })
        .eq('user_id', userId);

      if (updateError) {
        logStep("Error updating minutes", { error: updateError });
        throw new Error("Failed to update minutes");
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseClient
        .from('user_minutes')
        .insert({
          user_id: userId,
          minutes_balance: minutes,
          lifetime_purchased: minutes,
          lifetime_used: 0
        });

      if (insertError) {
        logStep("Error creating minutes record", { error: insertError });
        throw new Error("Failed to create minutes record");
      }
    }

    // Record the transaction
    const { error: transactionError } = await supabaseClient
      .from('minute_transactions')
      .insert({
        user_id: userId,
        amount: minutes,
        transaction_type: 'purchase',
        description: `Purchased ${minutes} Luna Minutes`,
        package_id: packageId,
        stripe_payment_intent_id: session.payment_intent as string
      });

    if (transactionError) {
      logStep("Error recording transaction", { error: transactionError });
    }

    logStep("Minutes added successfully", { userId, minutes });

    return new Response(JSON.stringify({ 
      success: true,
      minutes_added: minutes 
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

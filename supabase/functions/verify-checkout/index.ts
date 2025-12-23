import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId, type } = await req.json();
    if (!sessionId) throw new Error("Session ID required");
    logStep("Request received", { sessionId, type });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price']
    });

    if (session.payment_status !== 'paid') {
      logStep("Payment not completed", { status: session.payment_status });
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const metadata = session.metadata || {};
    logStep("Session metadata", metadata);

    // Handle different purchase types
    if (type === 'coins' || metadata.coins) {
      const coins = parseInt(metadata.coins || '0');
      if (coins > 0) {
        // Check if already credited
        const { data: existingTx } = await supabaseClient
          .from("coin_transactions")
          .select("id")
          .eq("reference_id", sessionId)
          .maybeSingle();

        if (!existingTx) {
          // Get or create user coins
          const { data: existingBalance } = await supabaseClient
            .from("user_coins")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingBalance) {
            await supabaseClient.from("user_coins").insert({
              user_id: user.id,
              balance: coins,
              lifetime_earned: coins,
            });
          } else {
            await supabaseClient
              .from("user_coins")
              .update({
                balance: existingBalance.balance + coins,
                lifetime_earned: existingBalance.lifetime_earned + coins,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);
          }

          // Record transaction
          await supabaseClient.from("coin_transactions").insert({
            user_id: user.id,
            amount: coins,
            transaction_type: "purchase",
            description: `Purchased ${coins} coins`,
            reference_id: sessionId,
          });

          logStep("Coins credited", { coins });
        } else {
          logStep("Coins already credited for this session");
        }

        return new Response(JSON.stringify({ success: true, type: 'coins', amount: coins }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (type === 'minutes' || metadata.type === 'luna_minutes') {
      const minutes = parseInt(metadata.minutes || '0');
      if (minutes > 0) {
        // Check if already credited
        const { data: existingTx } = await supabaseClient
          .from("minute_transactions")
          .select("id")
          .eq("stripe_payment_intent_id", session.payment_intent as string)
          .maybeSingle();

        if (!existingTx) {
          // Get or create user minutes
          const { data: existingMinutes } = await supabaseClient
            .from("user_minutes")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingMinutes) {
            await supabaseClient
              .from("user_minutes")
              .update({
                minutes_balance: existingMinutes.minutes_balance + minutes,
                lifetime_purchased: existingMinutes.lifetime_purchased + minutes,
              })
              .eq("user_id", user.id);
          } else {
            await supabaseClient.from("user_minutes").insert({
              user_id: user.id,
              minutes_balance: minutes,
              lifetime_purchased: minutes,
              lifetime_used: 0,
            });
          }

          // Record transaction
          await supabaseClient.from("minute_transactions").insert({
            user_id: user.id,
            amount: minutes,
            transaction_type: "purchase",
            description: `Purchased ${minutes} Luna Minutes`,
            package_id: metadata.package_id,
            stripe_payment_intent_id: session.payment_intent as string,
          });

          logStep("Minutes credited", { minutes });
        } else {
          logStep("Minutes already credited for this session");
        }

        return new Response(JSON.stringify({ success: true, type: 'minutes', amount: minutes }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Default - subscription or unknown type
    logStep("No specific type matched, returning success");
    return new Response(JSON.stringify({ success: true, type: 'subscription' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
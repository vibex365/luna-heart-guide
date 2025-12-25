import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map price IDs to plan slugs - includes all subscription prices
const PRICE_TO_PLAN: Record<string, string> = {
  // Legacy prices
  "price_1SdhyfAsrgxssNTVTPpZuI3t": "pro",
  "price_1SdhytAsrgxssNTVvlvnqvZr": "couples",
  // Current Pro prices
  "price_1ShIZlAsrgxssNTVizMEk01u": "pro",  // $4.99/month Pro
  "price_1ShIZmAsrgxssNTVDWiPIKmI": "pro",  // $38.99/year Pro
  // Current Couples prices  
  "price_1ShIZnAsrgxssNTVh4alx0aM": "couples", // $9.99/month Couples
  "price_1ShIZpAsrgxssNTV1uHtEk0k": "couples", // $77.99/year Couples
  // Older prices
  "price_1SgtXeAsrgxssNTVaje2ZpfF": "pro",  // $3.99/month
  "price_1SgtXfAsrgxssNTVakdF9Ip2": "pro",  // $29.99/year
  "price_1SgtXhAsrgxssNTVwWhWwzLb": "couples", // $7.99/month
  "price_1SgtXjAsrgxssNTVS4pbUHgj": "couples", // $59.99/year
};

// Map plan slugs to tier IDs in database
const PLAN_TO_TIER_ID: Record<string, string> = {
  "free": "e3c40c7d-003d-4c8c-b32b-b65c0e0f215a",
  "pro": "7a5e0dd1-ff59-4785-913e-e679f825b69c",
  "couples": "d66e16b8-f1cb-4aa6-9d84-90a19f8720b3",
};

// Free voice minutes per subscription tier (granted monthly)
const PLAN_FREE_MINUTES: Record<string, number> = {
  "pro": 5,
  "couples": 10,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key to sync subscriptions
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check if user already has an active admin-assigned subscription in the database
    const { data: existingSubscription } = await supabaseClient
      .from("user_subscriptions")
      .select("tier_id, status, subscription_tiers(slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // If user already has an active admin-assigned subscription, don't overwrite it
      if (existingSubscription) {
        const existingPlan = (existingSubscription.subscription_tiers as any)?.slug || "free";
        logStep("User has existing admin subscription, keeping it", { plan: existingPlan });
        return new Response(JSON.stringify({ 
          subscribed: existingPlan !== "free",
          plan: existingPlan,
          subscription_end: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // No existing subscription, sync free plan
      logStep("No existing subscription, syncing free plan");
      await syncSubscriptionToDatabase(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        user.id,
        "free",
        null
      );
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let plan = "free";
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Subscription data", { 
        id: subscription.id, 
        current_period_end: subscription.current_period_end,
        items: subscription.items?.data?.length
      });
      
      // Safely handle the date conversion
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      const priceId = subscription.items?.data?.[0]?.price?.id;
      plan = (priceId && PRICE_TO_PLAN[priceId]) || "pro";
      logStep("Active subscription found", { subscriptionId: subscription.id, plan, endDate: subscriptionEnd });
      
      // Only sync to database if there's an active Stripe subscription
      await syncSubscriptionToDatabase(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        user.id,
        plan,
        subscriptionEnd
      );

      // Grant free voice minutes for paid subscriptions
      const freeMinutes = PLAN_FREE_MINUTES[plan];
      if (freeMinutes) {
        await grantSubscriptionMinutes(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          user.id,
          plan,
          freeMinutes
        );
      }

      // Process referral conversion if this is a new subscription
      try {
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-referral-conversion`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              subscribedUserId: user.id,
              planType: plan,
            }),
          }
        );
        const refResult = await response.json();
        if (refResult.success) {
          logStep("Referral conversion processed", { referrerId: refResult.referrerId });
        }
      } catch (refError) {
        logStep("Referral conversion check failed (non-blocking)", { error: String(refError) });
      }
    } else {
      logStep("No active Stripe subscription");
      
      // If user has an admin-assigned subscription, return that instead
      if (existingSubscription) {
        const existingPlan = (existingSubscription.subscription_tiers as any)?.slug || "free";
        logStep("Using existing admin subscription", { plan: existingPlan });
        return new Response(JSON.stringify({
          subscribed: existingPlan !== "free",
          plan: existingPlan,
          subscription_end: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Unable to check subscription status. Please try again later." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function syncSubscriptionToDatabase(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  plan: string,
  expiresAt: string | null,
  source: 'stripe' | 'admin' | 'system' = 'stripe'
) {
  try {
    const tierId = PLAN_TO_TIER_ID[plan] || PLAN_TO_TIER_ID["free"];
    
    logStep("Syncing subscription to database", { userId, plan, tierId });

    // Check if user already has a subscription record
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=id,tier_id`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );
    
    const existingData = await checkResponse.json();
    const existing = existingData?.[0];

    if (existing) {
      // Update existing subscription
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${existing.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            tier_id: tierId,
            status: plan === "free" ? "inactive" : "active",
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
            source: source,
          }),
        }
      );

      if (!updateResponse.ok) {
        logStep("Error updating subscription", { status: updateResponse.status });
      } else {
        logStep("Subscription updated successfully");
      }
    } else {
      // Create new subscription record
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            user_id: userId,
            tier_id: tierId,
            status: plan === "free" ? "inactive" : "active",
            expires_at: expiresAt,
            started_at: new Date().toISOString(),
            source: source,
          }),
        }
      );

      if (!insertResponse.ok) {
        logStep("Error creating subscription", { status: insertResponse.status });
      } else {
        logStep("Subscription created successfully");
      }
    }
  } catch (syncError) {
    logStep("Error syncing subscription", { error: syncError instanceof Error ? syncError.message : String(syncError) });
  }
}

async function grantSubscriptionMinutes(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  plan: string,
  minutesToGrant: number
) {
  try {
    logStep("Checking subscription minutes grant", { userId, plan, minutesToGrant });

    // Check if user has a minutes record and when they last received subscription bonus
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_minutes?user_id=eq.${userId}&select=id,minutes_balance,last_subscription_grant`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    const existingData = await checkResponse.json();
    const existing = existingData?.[0];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check if we should grant minutes (not granted in last 30 days)
    if (existing?.last_subscription_grant) {
      const lastGrant = new Date(existing.last_subscription_grant);
      if (lastGrant > thirtyDaysAgo) {
        logStep("Subscription minutes already granted this period", { 
          lastGrant: lastGrant.toISOString(),
          nextEligible: new Date(lastGrant.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        return;
      }
    }

    if (existing) {
      // Update existing record - add minutes to balance
      const newBalance = (existing.minutes_balance || 0) + minutesToGrant;
      
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_minutes?id=eq.${existing.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            minutes_balance: newBalance,
            last_subscription_grant: now.toISOString(),
            updated_at: now.toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        logStep("Error updating user minutes", { status: updateResponse.status });
        return;
      }
    } else {
      // Create new minutes record
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_minutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            user_id: userId,
            minutes_balance: minutesToGrant,
            last_subscription_grant: now.toISOString(),
          }),
        }
      );

      if (!insertResponse.ok) {
        logStep("Error creating user minutes", { status: insertResponse.status });
        return;
      }
    }

    // Record the transaction
    const transactionResponse = await fetch(
      `${supabaseUrl}/rest/v1/minute_transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          transaction_type: "subscription_bonus",
          amount: minutesToGrant,
          description: `Monthly ${plan} subscription bonus - ${minutesToGrant} free minutes`,
        }),
      }
    );

    if (transactionResponse.ok) {
      logStep("Subscription minutes granted successfully", { userId, plan, minutes: minutesToGrant });
    } else {
      logStep("Error recording minutes transaction", { status: transactionResponse.status });
    }
  } catch (grantError) {
    logStep("Error granting subscription minutes", { error: grantError instanceof Error ? grantError.message : String(grantError) });
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedeemRequest {
  userId: string;
  rewardType: "free_month_pro" | "free_month_couples" | "bonus_coins";
  pointsCost: number;
}

const REWARD_CONFIGS = {
  free_month_pro: { pointsCost: 300, tierSlug: "pro", months: 1 },
  free_month_couples: { pointsCost: 450, tierSlug: "couples", months: 1 },
  bonus_coins: { pointsCost: 100, coinsAmount: 500 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, rewardType, pointsCost }: RedeemRequest = await req.json();

    console.log(`Processing redemption: user=${userId}, type=${rewardType}, cost=${pointsCost}`);

    if (!userId || !rewardType || !pointsCost) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const config = REWARD_CONFIGS[rewardType];
    if (!config || config.pointsCost !== pointsCost) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid reward configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user's current points
    const { data: pointsData, error: pointsError } = await supabase
      .from("referral_points")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (pointsError || !pointsData) {
      console.log("User has no points record");
      return new Response(
        JSON.stringify({ success: false, error: "No points balance found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (pointsData.balance < pointsCost) {
      console.log(`Insufficient points: ${pointsData.balance} < ${pointsCost}`);
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient points" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Deduct points
    await supabase
      .from("referral_points")
      .update({ balance: pointsData.balance - pointsCost })
      .eq("user_id", userId);

    // Record transaction
    await supabase
      .from("referral_point_transactions")
      .insert({
        user_id: userId,
        amount: -pointsCost,
        transaction_type: "redemption",
        description: `Redeemed: ${rewardType.replace(/_/g, " ")}`,
      });

    let subscriptionExtendedTo: string | null = null;
    let monthsGranted: number | null = null;

    if (rewardType === "bonus_coins") {
      // Award bonus coins
      const coinsAmount = (config as typeof REWARD_CONFIGS.bonus_coins).coinsAmount;
      
      // Get or create user coins record
      const { data: existingCoins } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingCoins) {
        await supabase
          .from("user_coins")
          .update({
            balance: existingCoins.balance + coinsAmount,
            lifetime_earned: existingCoins.lifetime_earned + coinsAmount,
          })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_coins")
          .insert({
            user_id: userId,
            balance: coinsAmount,
            lifetime_earned: coinsAmount,
          });
      }

      // Record coin transaction
      await supabase
        .from("coin_transactions")
        .insert({
          user_id: userId,
          amount: coinsAmount,
          transaction_type: "referral_bonus",
          description: "Referral reward: 500 Luna Coins",
        });
    } else {
      // Handle subscription rewards
      const tierSlug = (config as typeof REWARD_CONFIGS.free_month_pro).tierSlug;
      const months = (config as typeof REWARD_CONFIGS.free_month_pro).months;
      monthsGranted = months;

      // Get the subscription tier
      const { data: tier, error: tierError } = await supabase
        .from("subscription_tiers")
        .select("id")
        .eq("slug", tierSlug)
        .maybeSingle();

      if (tierError || !tier) {
        console.error("Tier not found:", tierSlug);
        throw new Error("Subscription tier not found");
      }

      // Check for existing subscription
      const { data: existingSub } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      const now = new Date();
      let expiresAt: Date;

      if (existingSub) {
        // Extend existing subscription
        const currentExpiry = existingSub.expires_at 
          ? new Date(existingSub.expires_at) 
          : now;
        
        // If current subscription is already expired, start from now
        const startDate = currentExpiry > now ? currentExpiry : now;
        expiresAt = new Date(startDate);
        expiresAt.setMonth(expiresAt.getMonth() + months);

        await supabase
          .from("user_subscriptions")
          .update({
            tier_id: tier.id,
            expires_at: expiresAt.toISOString(),
            status: "active",
          })
          .eq("id", existingSub.id);
      } else {
        // Create new subscription
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + months);

        await supabase
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            tier_id: tier.id,
            status: "active",
            expires_at: expiresAt.toISOString(),
            source: "referral",
          });
      }

      subscriptionExtendedTo = expiresAt.toISOString();
    }

    // Record redemption
    await supabase
      .from("referral_redemptions")
      .insert({
        user_id: userId,
        points_spent: pointsCost,
        reward_type: rewardType,
        months_granted: monthsGranted,
        subscription_extended_to: subscriptionExtendedTo,
      });

    console.log(`Redemption successful: ${rewardType}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        rewardType,
        subscriptionExtendedTo,
        monthsGranted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing redemption:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

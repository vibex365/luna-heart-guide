import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referredUserId: string;
  referralCode: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { referredUserId, referralCode }: ProcessReferralRequest = await req.json();

    console.log(`Processing referral signup: user=${referredUserId}, code=${referralCode}`);

    if (!referredUserId || !referralCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("referral_code", referralCode.toUpperCase())
      .maybeSingle();

    if (referrerError || !referrer) {
      console.log(`Invalid referral code: ${referralCode}`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid referral code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Don't allow self-referral
    if (referrer.user_id === referredUserId) {
      console.log("Self-referral attempted");
      return new Response(
        JSON.stringify({ success: false, error: "Cannot refer yourself" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if user was already referred
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", referredUserId)
      .maybeSingle();

    if (existingReferral) {
      console.log("User already has a referrer");
      return new Response(
        JSON.stringify({ success: false, error: "User already referred" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create the referral record
    const { error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.user_id,
        referred_user_id: referredUserId,
        status: "pending",
        points_awarded: 25, // Points for signup
      });

    if (referralError) {
      console.error("Error creating referral:", referralError);
      throw referralError;
    }

    // Get or create referral points record
    const { data: existingPoints } = await supabase
      .from("referral_points")
      .select("*")
      .eq("user_id", referrer.user_id)
      .maybeSingle();

    let isFirstReferral = false;

    if (!existingPoints) {
      // Create new points record - first referral ever!
      isFirstReferral = true;
      const firstReferralBonus = 50;
      const signupPoints = 25;
      const totalPoints = signupPoints + firstReferralBonus;

      await supabase
        .from("referral_points")
        .insert({
          user_id: referrer.user_id,
          balance: totalPoints,
          lifetime_earned: totalPoints,
          total_referrals: 1,
          successful_conversions: 0,
          level: "starter",
        });

      // Record signup transaction
      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: signupPoints,
          transaction_type: "referral_signup",
          description: "Friend signed up with your code",
        });

      // Record first referral bonus
      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: firstReferralBonus,
          transaction_type: "bonus",
          description: "First referral bonus! 🎉",
        });
    } else {
      // Update existing points record
      const newTotalReferrals = existingPoints.total_referrals + 1;
      let bonusPoints = 0;
      let bonusDescription = "";

      // Check for milestone bonuses
      if (newTotalReferrals === 5) {
        bonusPoints = 100;
        bonusDescription = "5 referrals milestone bonus! 🌟";
      } else if (newTotalReferrals === 10) {
        bonusPoints = 250;
        bonusDescription = "10 referrals milestone bonus! 🏆";
      } else if (newTotalReferrals === 25) {
        bonusPoints = 500;
        bonusDescription = "25 referrals milestone bonus! 👑";
      } else if (newTotalReferrals === 50) {
        bonusPoints = 1000;
        bonusDescription = "50 referrals milestone bonus! 🔥";
      }

      const signupPoints = 25;
      const totalNewPoints = signupPoints + bonusPoints;

      await supabase
        .from("referral_points")
        .update({
          balance: existingPoints.balance + totalNewPoints,
          lifetime_earned: existingPoints.lifetime_earned + totalNewPoints,
          total_referrals: newTotalReferrals,
        })
        .eq("user_id", referrer.user_id);

      // Record signup transaction
      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: signupPoints,
          transaction_type: "referral_signup",
          description: "Friend signed up with your code",
        });

      // Record milestone bonus if applicable
      if (bonusPoints > 0) {
        await supabase
          .from("referral_point_transactions")
          .insert({
            user_id: referrer.user_id,
            amount: bonusPoints,
            transaction_type: "milestone",
            description: bonusDescription,
          });
      }
    }

    console.log(`Referral processed successfully. Referrer: ${referrer.user_id}, First: ${isFirstReferral}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        referrerId: referrer.user_id,
        isFirstReferral,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing referral:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

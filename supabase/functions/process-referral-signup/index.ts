import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referredUserId: string;
  referralCode: string;
}

// Helper to send SMS notification to referrer
async function notifyReferrerSignup(
  referrerPhone: string,
  referredName: string
) {
  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio not configured, skipping SMS");
      return;
    }

    const message = `🎉 Great news! ${referredName || "Someone"} just joined Luna using your referral code! You earned 25 points. Keep sharing to unlock more rewards!`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: referrerPhone,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    console.log(`SMS notification sent to referrer`);
  } catch (error) {
    console.error("Failed to send SMS notification:", error);
  }
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
      .select("user_id, display_name, phone_number, phone_verified, sms_notifications_enabled")
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

    // Get referred user's name
    const { data: referredUser } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", referredUserId)
      .maybeSingle();

    // Create the referral record
    const { error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.user_id,
        referred_user_id: referredUserId,
        status: "pending",
        points_awarded: 25,
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

      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: signupPoints,
          transaction_type: "referral_signup",
          description: "Friend signed up with your code",
        });

      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: firstReferralBonus,
          transaction_type: "bonus",
          description: "First referral bonus! 🎉",
        });
    } else {
      const newTotalReferrals = existingPoints.total_referrals + 1;
      let bonusPoints = 0;
      let bonusDescription = "";

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

      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referrer.user_id,
          amount: signupPoints,
          transaction_type: "referral_signup",
          description: "Friend signed up with your code",
        });

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

    // Send SMS notification if referrer has verified phone
    if (referrer.phone_number && referrer.phone_verified && referrer.sms_notifications_enabled !== false) {
      await notifyReferrerSignup(referrer.phone_number, referredUser?.display_name || "Someone");
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

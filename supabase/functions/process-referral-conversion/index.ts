import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionRequest {
  subscribedUserId: string;
  planType: "pro" | "couples";
}

// Helper to send SMS notification to referrer
async function notifyReferrerConversion(
  referrerPhone: string,
  referredName: string,
  planType: string,
  bonusPoints: number
) {
  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio not configured, skipping SMS");
      return;
    }

    const planName = planType === "couples" ? "Couples" : "Pro";
    const message = `🎊 Amazing! ${referredName || "Your friend"} just subscribed to Luna ${planName}! You earned ${bonusPoints} bonus points. Check your rewards at talkswithluna.com/referrals`;

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

    console.log(`SMS notification sent to referrer about conversion`);
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

    const { subscribedUserId, planType }: ConversionRequest = await req.json();

    console.log(`Processing referral conversion: user=${subscribedUserId}, plan=${planType}`);

    if (!subscribedUserId || !planType) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find the referral for this user
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_user_id", subscribedUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (referralError || !referral) {
      console.log("No pending referral found for user");
      return new Response(
        JSON.stringify({ success: false, error: "No pending referral found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get referrer's profile for SMS
    const { data: referrer } = await supabase
      .from("profiles")
      .select("phone_number, phone_verified, sms_notifications_enabled")
      .eq("user_id", referral.referrer_id)
      .maybeSingle();

    // Get referred user's name
    const { data: referredUser } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", subscribedUserId)
      .maybeSingle();

    // Calculate bonus points based on plan type
    const bonusPoints = planType === "couples" ? 150 : 100;

    // Update referral status
    await supabase
      .from("referrals")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
        points_awarded: referral.points_awarded + bonusPoints,
      })
      .eq("id", referral.id);

    // Update referrer's points
    const { data: referrerPoints } = await supabase
      .from("referral_points")
      .select("*")
      .eq("user_id", referral.referrer_id)
      .maybeSingle();

    if (referrerPoints) {
      await supabase
        .from("referral_points")
        .update({
          balance: referrerPoints.balance + bonusPoints,
          lifetime_earned: referrerPoints.lifetime_earned + bonusPoints,
          successful_conversions: referrerPoints.successful_conversions + 1,
        })
        .eq("user_id", referral.referrer_id);

      // Record transaction
      await supabase
        .from("referral_point_transactions")
        .insert({
          user_id: referral.referrer_id,
          amount: bonusPoints,
          transaction_type: "referral_conversion",
          reference_id: referral.id,
          description: `Friend subscribed to ${planType === "couples" ? "Couples" : "Pro"}! 🎉`,
        });
    }

    // Send SMS notification if referrer has verified phone
    if (referrer?.phone_number && referrer?.phone_verified && referrer?.sms_notifications_enabled !== false) {
      await notifyReferrerConversion(
        referrer.phone_number,
        referredUser?.display_name || "Your friend",
        planType,
        bonusPoints
      );
    }

    console.log(`Conversion processed: referrer=${referral.referrer_id}, bonus=${bonusPoints}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        referrerId: referral.referrer_id,
        bonusPoints,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing conversion:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

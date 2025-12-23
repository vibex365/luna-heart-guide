import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionRequest {
  subscribedUserId: string;
  planType: "pro" | "couples";
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

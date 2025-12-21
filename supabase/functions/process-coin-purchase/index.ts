import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { sessionId, userId, coins } = await req.json();
    
    if (!userId || !coins) {
      throw new Error("Missing userId or coins");
    }

    const coinsAmount = parseInt(coins, 10);

    // Get or create user coins
    const { data: existingBalance } = await supabaseAdmin
      .from("user_coins")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingBalance) {
      await supabaseAdmin.from("user_coins").insert({
        user_id: userId,
        balance: coinsAmount,
        lifetime_earned: coinsAmount,
      });
    } else {
      await supabaseAdmin
        .from("user_coins")
        .update({
          balance: existingBalance.balance + coinsAmount,
          lifetime_earned: existingBalance.lifetime_earned + coinsAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    // Record transaction
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: userId,
      amount: coinsAmount,
      transaction_type: "purchase",
      description: `Purchased ${coinsAmount} coins`,
      reference_id: sessionId,
    });

    return new Response(JSON.stringify({ success: true, coins: coinsAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Process coin purchase error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

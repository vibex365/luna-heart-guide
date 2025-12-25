import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "moderator"]);

    if (!roles || roles.length === 0) {
      throw new Error("Admin access required");
    }

    console.log("[ADMIN-FINANCIALS] Admin verified:", userData.user.id);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get Stripe balance
    const balance = await stripe.balance.retrieve();
    console.log("[ADMIN-FINANCIALS] Balance retrieved");

    // Get recent charges (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte: thirtyDaysAgo },
    });
    console.log("[ADMIN-FINANCIALS] Charges retrieved:", charges.data.length);

    // Calculate revenue metrics
    const successfulCharges = charges.data.filter((c: Stripe.Charge) => c.status === "succeeded");
    let totalRevenue30d = 0;
    let refundedAmount = 0;
    for (const c of successfulCharges) {
      totalRevenue30d += c.amount;
      refundedAmount += c.amount_refunded || 0;
    }
    totalRevenue30d = totalRevenue30d / 100;
    refundedAmount = refundedAmount / 100;
    const netRevenue30d = totalRevenue30d - refundedAmount;

    // Get recent subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "active",
    });
    console.log("[ADMIN-FINANCIALS] Active subscriptions:", subscriptions.data.length);

    // Calculate MRR from Stripe
    let mrr = 0;
    for (const sub of subscriptions.data) {
      const item = sub.items.data[0];
      if (item?.price?.unit_amount && item?.price?.recurring?.interval === "month") {
        mrr += item.price.unit_amount / 100;
      } else if (item?.price?.unit_amount && item?.price?.recurring?.interval === "year") {
        mrr += item.price.unit_amount / 100 / 12;
      }
    }

    // Get recent payments for transaction log
    const recentPayments = await stripe.paymentIntents.list({
      limit: 20,
    });

    const transactions: Array<{
      id: string;
      amount: number;
      currency: string;
      description: string;
      customer_email: string | null;
      created: string;
    }> = [];

    for (const p of recentPayments.data) {
      if (p.status === "succeeded") {
        transactions.push({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency.toUpperCase(),
          description: p.description || "Payment",
          customer_email: p.receipt_email,
          created: new Date(p.created * 1000).toISOString(),
        });
      }
    }

    // Get coin transactions from database
    const { data: coinTx } = await supabaseAdmin
      .from("coin_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get minute transactions from database
    const { data: minuteTx } = await supabaseAdmin
      .from("minute_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get gift transactions
    const { data: giftTx } = await supabaseAdmin
      .from("gift_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Calculate balance totals
    let availableBalance = 0;
    let pendingBalance = 0;
    for (const b of balance.available) {
      availableBalance += b.amount;
    }
    for (const b of balance.pending) {
      pendingBalance += b.amount;
    }

    return new Response(JSON.stringify({
      balance: {
        available: availableBalance / 100,
        pending: pendingBalance / 100,
        currency: balance.available[0]?.currency?.toUpperCase() || "USD",
      },
      revenue: {
        total_30d: totalRevenue30d,
        net_30d: netRevenue30d,
        refunded_30d: refundedAmount,
        mrr: mrr,
        active_subscriptions: subscriptions.data.length,
        charges_count: successfulCharges.length,
      },
      recent_transactions: transactions,
      coin_transactions: coinTx || [],
      minute_transactions: minuteTx || [],
      gift_transactions: giftTx || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN-FINANCIALS] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errorMessage === "Admin access required" ? 403 : 500,
    });
  }
});

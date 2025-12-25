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

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "active",
    });
    console.log("[ADMIN-FINANCIALS] Active subscriptions:", subscriptions.data.length);

    // Get canceled subscriptions in last 30 days for churn calculation
    const canceledSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "canceled",
      created: { gte: thirtyDaysAgo },
    });
    console.log("[ADMIN-FINANCIALS] Canceled subscriptions (30d):", canceledSubscriptions.data.length);

    // Get all subscriptions created before 30 days ago (to calculate starting base)
    const allSubscriptionsAtStart = await stripe.subscriptions.list({
      limit: 100,
      created: { lt: thirtyDaysAgo },
    });
    
    // Churn rate = (Canceled in period / Active at start of period) * 100
    const activeAtStart = allSubscriptionsAtStart.data.filter((s: Stripe.Subscription) => 
      s.status === "active" || s.status === "canceled"
    ).length || subscriptions.data.length; // fallback to current active
    
    const churnRate = activeAtStart > 0 
      ? (canceledSubscriptions.data.length / activeAtStart) * 100 
      : 0;
    
    // Calculate monthly churn (annualized would be churnRate * 12)
    const monthlyChurnRate = Math.round(churnRate * 10) / 10;
    
    // Revenue lost from churned customers
    let lostMrr = 0;
    for (const sub of canceledSubscriptions.data) {
      const item = sub.items.data[0];
      if (item?.price?.unit_amount && item?.price?.recurring?.interval === "month") {
        lostMrr += item.price.unit_amount / 100;
      } else if (item?.price?.unit_amount && item?.price?.recurring?.interval === "year") {
        lostMrr += item.price.unit_amount / 100 / 12;
      }
    }

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

    // Get gift transactions (with price info)
    const { data: giftTx } = await supabaseAdmin
      .from("partner_gifts")
      .select("*, digital_gifts(price_cents, name)")
      .order("created_at", { ascending: false })
      .limit(20);

    // --- COUPLES METRICS ---
    // Get active partner links (couples)
    const { count: activeLinksCount } = await supabaseAdmin
      .from("partner_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted");
    
    // Get total gift revenue (all time)
    const { data: allGifts } = await supabaseAdmin
      .from("partner_gifts")
      .select("gift_id, digital_gifts(price_cents)");
    
    let totalGiftRevenue = 0;
    for (const gift of allGifts || []) {
      totalGiftRevenue += (gift.digital_gifts as any)?.price_cents || 0;
    }
    
    // Get gift revenue last 30 days
    const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentGifts } = await supabaseAdmin
      .from("partner_gifts")
      .select("gift_id, digital_gifts(price_cents)")
      .gte("created_at", thirtyDaysAgoISO);
    
    let giftRevenue30d = 0;
    for (const gift of recentGifts || []) {
      giftRevenue30d += (gift.digital_gifts as any)?.price_cents || 0;
    }
    
    // Get couples activities completed (30d)
    const { count: activitiesCount } = await supabaseAdmin
      .from("completed_activities")
      .select("*", { count: "exact", head: true })
      .gte("completed_at", thirtyDaysAgoISO);
    
    // Get couples messages count (30d) for engagement
    const { count: messagesCount } = await supabaseAdmin
      .from("couples_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgoISO);
    
    // Get couples with active streaks
    const { data: streakData } = await supabaseAdmin
      .from("couples_streaks")
      .select("current_streak")
      .gt("current_streak", 0);
    
    const activeStreaks = streakData?.length || 0;
    const avgStreak = streakData && streakData.length > 0
      ? Math.round(streakData.reduce((sum, s) => sum + s.current_streak, 0) / streakData.length)
      : 0;
    
    console.log("[ADMIN-FINANCIALS] Couples metrics calculated");

    // --- REFERRAL METRICS ---
    // Total referrals
    const { count: totalReferrals } = await supabaseAdmin
      .from("referrals")
      .select("*", { count: "exact", head: true });
    
    // Successful conversions (status = 'converted')
    const { count: convertedReferrals } = await supabaseAdmin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted");
    
    // Referrals in last 30 days
    const { count: referrals30d } = await supabaseAdmin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgoISO);
    
    // Conversions in last 30 days
    const { count: conversions30d } = await supabaseAdmin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted")
      .gte("converted_at", thirtyDaysAgoISO);
    
    // Total points earned (proxy for value given)
    const { data: pointsData } = await supabaseAdmin
      .from("referral_points")
      .select("lifetime_earned, balance");
    
    let totalPointsEarned = 0;
    let totalPointsBalance = 0;
    for (const p of pointsData || []) {
      totalPointsEarned += p.lifetime_earned || 0;
      totalPointsBalance += p.balance || 0;
    }
    
    // Free months redeemed via referrals
    const { data: redemptions } = await supabaseAdmin
      .from("referral_redemptions")
      .select("points_spent, months_granted, reward_type");
    
    let freeMonthsRewarded = 0;
    let totalPointsRedeemed = 0;
    for (const r of redemptions || []) {
      if (r.reward_type === 'free_month' || r.months_granted) {
        freeMonthsRewarded += r.months_granted || 1;
      }
      totalPointsRedeemed += r.points_spent || 0;
    }
    
    // Top referrers
    const { data: topReferrers } = await supabaseAdmin
      .from("referral_leaderboard")
      .select("display_name, total_referrals, successful_conversions, level")
      .order("total_referrals", { ascending: false })
      .limit(5);
    
    console.log("[ADMIN-FINANCIALS] Referral metrics calculated");

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
        churn_rate: monthlyChurnRate,
        churned_customers: canceledSubscriptions.data.length,
        lost_mrr: lostMrr,
      },
      couples: {
        active_couples: activeLinksCount || 0,
        total_gift_revenue: totalGiftRevenue / 100,
        gift_revenue_30d: giftRevenue30d / 100,
        activities_30d: activitiesCount || 0,
        messages_30d: messagesCount || 0,
        active_streaks: activeStreaks,
        avg_streak: avgStreak,
      },
      referrals: {
        total_referrals: totalReferrals || 0,
        converted_referrals: convertedReferrals || 0,
        referrals_30d: referrals30d || 0,
        conversions_30d: conversions30d || 0,
        conversion_rate: totalReferrals ? Math.round((convertedReferrals || 0) / totalReferrals * 100) : 0,
        total_points_earned: totalPointsEarned,
        total_points_balance: totalPointsBalance,
        points_redeemed: totalPointsRedeemed,
        free_months_rewarded: freeMonthsRewarded,
        top_referrers: topReferrers || [],
      },
      recent_transactions: transactions,
      coin_transactions: coinTx || [],
      minute_transactions: minuteTx || [],
      gift_transactions: (giftTx || []).map((g: any) => ({
        id: g.id,
        sender_id: g.sender_id,
        recipient_id: g.recipient_id,
        gift_id: g.gift_id,
        amount_cents: g.digital_gifts?.price_cents || 0,
        gift_name: g.digital_gifts?.name || "Gift",
        created_at: g.created_at,
      })),
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

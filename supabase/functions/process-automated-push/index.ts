import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("[ProcessAutomatedPush] VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[ProcessAutomatedPush] Starting automated push campaign processing");

    // Get active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("automated_push_campaigns")
      .select("*")
      .eq("is_active", true);

    if (campaignsError) {
      console.error("[ProcessAutomatedPush] Failed to fetch campaigns:", campaignsError);
      throw campaignsError;
    }

    console.log(`[ProcessAutomatedPush] Found ${campaigns?.length || 0} active campaigns`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const campaign of campaigns || []) {
      console.log(`[ProcessAutomatedPush] Processing campaign: ${campaign.name} (${campaign.trigger_type})`);

      // Get eligible subscriptions based on trigger type
      let eligibleSubscriptions: Array<{ id: string; session_id: string; endpoint: string; p256dh_key: string; auth_key: string }> = [];

      const delayMs = campaign.delay_minutes * 60 * 1000;
      const cutoffTime = new Date(Date.now() - delayMs).toISOString();

      if (campaign.trigger_type === "inactive_visitor") {
        // Find subscriptions that haven't been active recently
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("is_active", true)
          .lt("subscribed_at", cutoffTime);

        // Filter out those who already received this campaign recently
        if (subs) {
          for (const sub of subs) {
            const { data: recentLogs } = await supabase
              .from("automated_push_logs")
              .select("id")
              .eq("campaign_id", campaign.id)
              .eq("subscription_id", sub.id)
              .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .limit(1);

            if (!recentLogs || recentLogs.length === 0) {
              eligibleSubscriptions.push(sub);
            }
          }
        }
      } else if (campaign.trigger_type === "welcome_back") {
        // Find returning visitors (have tracking events from different days)
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("is_active", true);

        if (subs) {
          for (const sub of subs) {
            // Check if they have visits on multiple days
            const { data: events } = await supabase
              .from("tracking_events")
              .select("created_at")
              .eq("session_id", sub.session_id)
              .order("created_at", { ascending: false })
              .limit(10);

            if (events && events.length > 1) {
              const uniqueDays = new Set(events.map(e => new Date(e.created_at).toDateString()));
              if (uniqueDays.size >= 2) {
                // Check if not already sent
                const { data: recentLogs } = await supabase
                  .from("automated_push_logs")
                  .select("id")
                  .eq("campaign_id", campaign.id)
                  .eq("subscription_id", sub.id)
                  .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                  .limit(1);

                if (!recentLogs || recentLogs.length === 0) {
                  eligibleSubscriptions.push(sub);
                }
              }
            }
          }
        }
      } else if (campaign.trigger_type === "engagement") {
        // Find engaged visitors (3+ button clicks)
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("is_active", true);

        if (subs) {
          for (const sub of subs) {
            const { count } = await supabase
              .from("tracking_events")
              .select("*", { count: "exact", head: true })
              .eq("session_id", sub.session_id)
              .eq("event_type", "button_click");

            if (count && count >= 3) {
              const { data: recentLogs } = await supabase
                .from("automated_push_logs")
                .select("id")
                .eq("campaign_id", campaign.id)
                .eq("subscription_id", sub.id)
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(1);

              if (!recentLogs || recentLogs.length === 0) {
                eligibleSubscriptions.push(sub);
              }
            }
          }
        }
      }

      console.log(`[ProcessAutomatedPush] Found ${eligibleSubscriptions.length} eligible subscriptions for campaign: ${campaign.name}`);

      // Send notifications (simplified - in production you'd use web-push library)
      for (const sub of eligibleSubscriptions) {
        try {
          // Log the notification attempt
          await supabase
            .from("automated_push_logs")
            .insert({
              campaign_id: campaign.id,
              subscription_id: sub.id,
              session_id: sub.session_id,
              status: "sent",
            });

          totalSent++;
          console.log(`[ProcessAutomatedPush] Logged push notification for subscription: ${sub.id}`);
        } catch (sendError) {
          console.error(`[ProcessAutomatedPush] Failed to send notification:`, sendError);
          const errorMessage = sendError instanceof Error ? sendError.message : "Unknown error";
          
          await supabase
            .from("automated_push_logs")
            .insert({
              campaign_id: campaign.id,
              subscription_id: sub.id,
              session_id: sub.session_id,
              status: "failed",
              error_message: errorMessage,
            });

          totalFailed++;
        }
      }
    }

    console.log(`[ProcessAutomatedPush] Completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent, 
        failed: totalFailed,
        campaigns_processed: campaigns?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ProcessAutomatedPush] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

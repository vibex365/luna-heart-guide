import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "low_messages" | "subscription_expiring" | "subscription_expired";
  userId?: string;
  checkAll?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, userId, checkAll } = await req.json() as NotificationRequest;
    console.log(`[NOTIFICATIONS] Processing type: ${type}, checkAll: ${checkAll}`);

    const notifications: { email: string; subject: string; html: string }[] = [];

    if (type === "low_messages" || checkAll) {
      // Find users with low message counts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get free tier info
      const { data: freeTier } = await supabase
        .from("subscription_tiers")
        .select("id, limits")
        .eq("slug", "free")
        .single();

      if (freeTier) {
        const messagesLimit = (freeTier.limits as any)?.messages_per_day || 5;
        const warningThreshold = Math.floor(messagesLimit * 0.4); // 40% remaining = 2 messages for limit of 5

        // Get users with their message counts for today
        const { data: users } = await supabase
          .from("profiles")
          .select(`
            user_id,
            display_name
          `);

        if (users) {
          for (const user of users) {
            // Check if user is on free tier
            const { data: subscription } = await supabase
              .from("user_subscriptions")
              .select("tier_id")
              .eq("user_id", user.user_id)
              .eq("status", "active")
              .single();

            if (!subscription || subscription.tier_id === freeTier.id) {
              // Count today's messages
              const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("role", "user")
                .gte("created_at", today.toISOString())
                .in("conversation_id", 
                  await supabase
                    .from("conversations")
                    .select("id")
                    .eq("user_id", user.user_id)
                    .then(r => r.data?.map(c => c.id) || [])
                );

              const remaining = messagesLimit - (count || 0);
              
              if (remaining <= warningThreshold && remaining > 0) {
                // Get user email from auth
                const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
                
                if (authUser?.user?.email) {
                  notifications.push({
                    email: authUser.user.email,
                    subject: `Luna: You have ${remaining} message${remaining === 1 ? '' : 's'} left today`,
                    html: `
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #9b87f5;">Hi ${user.display_name || 'there'}! 💜</h1>
                        <p style="font-size: 16px; color: #333;">Just a friendly heads up - you have <strong>${remaining} message${remaining === 1 ? '' : 's'}</strong> remaining in your daily Luna chat allowance.</p>
                        <p style="font-size: 16px; color: #333;">Want unlimited conversations with Luna?</p>
                        <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/subscription" 
                           style="display: inline-block; background: linear-gradient(135deg, #9b87f5, #7E69AB); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                          Upgrade to Pro
                        </a>
                        <p style="font-size: 14px; color: #666;">Your messages reset at midnight. Keep taking care of your mental wellness! 🌟</p>
                      </div>
                    `,
                  });
                }
              }
            }
          }
        }
      }
    }

    if (type === "subscription_expiring" || checkAll) {
      // Find subscriptions expiring in the next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const { data: expiringSubscriptions } = await supabase
        .from("user_subscriptions")
        .select(`
          user_id,
          expires_at,
          subscription_tiers (
            name
          )
        `)
        .eq("status", "active")
        .not("expires_at", "is", null)
        .lte("expires_at", threeDaysFromNow.toISOString())
        .gte("expires_at", new Date().toISOString());

      if (expiringSubscriptions) {
        for (const sub of expiringSubscriptions) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", sub.user_id)
            .single();

          const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);
          
          if (authUser?.user?.email) {
            const expiresAt = new Date(sub.expires_at!);
            const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const tierName = (sub.subscription_tiers as any)?.name || "Pro";

            notifications.push({
              email: authUser.user.email,
              subject: `Your Luna ${tierName} subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #9b87f5;">Hi ${profile?.display_name || 'there'}! 💜</h1>
                  <p style="font-size: 16px; color: #333;">Your Luna <strong>${tierName}</strong> subscription will expire on <strong>${expiresAt.toLocaleDateString()}</strong>.</p>
                  <p style="font-size: 16px; color: #333;">Don't lose access to:</p>
                  <ul style="color: #333;">
                    <li>Unlimited daily messages with Luna</li>
                    <li>Personalized weekly insights</li>
                    <li>Ambient sounds & premium features</li>
                    <li>Data export capability</li>
                  </ul>
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/subscription" 
                     style="display: inline-block; background: linear-gradient(135deg, #9b87f5, #7E69AB); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                    Renew Subscription
                  </a>
                  <p style="font-size: 14px; color: #666;">Thank you for being part of the Luna community! 🌟</p>
                </div>
              `,
            });
          }
        }
      }
    }

    // Send all notifications
    const results: { email: string; success: boolean; id?: string; error?: string }[] = [];
    for (const notification of notifications) {
      try {
        const result = await resend.emails.send({
          from: "Luna <onboarding@resend.dev>",
          to: [notification.email],
          subject: notification.subject,
          html: notification.html,
        });
        results.push({ email: notification.email, success: true, id: (result as any)?.id });
        console.log(`[NOTIFICATIONS] Sent to ${notification.email}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[NOTIFICATIONS] Failed to send to ${notification.email}:`, err);
        results.push({ email: notification.email, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: results.filter(r => r.success).length,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[NOTIFICATIONS] Error:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "low_messages" | "subscription_expiring" | "subscription_expired";
  userId?: string;
  checkAll?: boolean;
}

async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[NOTIFICATIONS] Twilio credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[NOTIFICATIONS] Twilio error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to send SMS:', error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, userId, checkAll } = await req.json() as NotificationRequest;
    console.log(`[NOTIFICATIONS] Processing type: ${type}, checkAll: ${checkAll}`);

    const notifications: { phone: string; message: string; userId: string }[] = [];

    if (type === "low_messages" || checkAll) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: freeTier } = await supabase
        .from("subscription_tiers")
        .select("id, limits")
        .eq("slug", "free")
        .single();

      if (freeTier) {
        const messagesLimit = (freeTier.limits as any)?.messages_per_day || 5;
        const warningThreshold = Math.floor(messagesLimit * 0.4);

        const { data: users } = await supabase
          .from("profiles")
          .select("user_id, display_name, phone_number, phone_verified, sms_notifications_enabled");

        if (users) {
          for (const user of users) {
            if (!user.phone_verified || !user.sms_notifications_enabled || !user.phone_number) continue;

            const { data: subscription } = await supabase
              .from("user_subscriptions")
              .select("tier_id")
              .eq("user_id", user.user_id)
              .eq("status", "active")
              .single();

            if (!subscription || subscription.tier_id === freeTier.id) {
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
                notifications.push({
                  phone: user.phone_number,
                  userId: user.user_id,
                  message: `💜 Luna: Hi ${user.display_name || 'there'}! You have ${remaining} message${remaining === 1 ? '' : 's'} left today. Upgrade to Pro for unlimited conversations! 🌟`,
                });
              }
            }
          }
        }
      }
    }

    if (type === "subscription_expiring" || checkAll) {
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
            .select("display_name, phone_number, phone_verified, sms_notifications_enabled")
            .eq("user_id", sub.user_id)
            .single();

          if (profile?.phone_verified && profile?.sms_notifications_enabled && profile?.phone_number) {
            const expiresAt = new Date(sub.expires_at!);
            const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const tierName = (sub.subscription_tiers as any)?.name || "Pro";

            notifications.push({
              phone: profile.phone_number,
              userId: sub.user_id,
              message: `💜 Luna: Hi ${profile.display_name || 'there'}! Your ${tierName} subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew to keep unlimited access! 🌟`,
            });
          }
        }
      }
    }

    // Send all SMS notifications
    const results: { phone: string; success: boolean; error?: string }[] = [];
    for (const notification of notifications) {
      try {
        const success = await sendSms(notification.phone, notification.message);
        results.push({ phone: notification.phone, success });
        if (success) {
          console.log(`[NOTIFICATIONS] SMS sent to ${notification.phone}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[NOTIFICATIONS] Failed to send SMS to ${notification.phone}:`, err);
        results.push({ phone: notification.phone, success: false, error: errorMessage });
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

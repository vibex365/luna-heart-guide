import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for scheduled invocations
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow both cron invocations and manual testing
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if it's a valid Supabase auth token for manual testing
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (authHeader !== `Bearer ${supabaseAnonKey}`) {
        console.log("Unauthorized request - invalid auth header");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper to send SMS via Twilio
    const sendSms = async (to: string, body: string) => {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: twilioPhoneNumber,
          Body: body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Twilio error:", error);
        throw new Error(`Failed to send SMS: ${error}`);
      }

      return response.json();
    };

    // Get today's date and dates for reminders (0, 1, 3, 7 days ahead)
    const today = new Date();
    const reminderDays = [0, 1, 3, 7];
    
    const datesToCheck = reminderDays.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return {
        days,
        dateStr: date.toISOString().split("T")[0],
      };
    });

    console.log("Checking milestones for dates:", datesToCheck.map(d => d.dateStr));

    let totalNotificationsSent = 0;
    const results: { milestone: string; usersNotified: number; daysUntil: number }[] = [];

    for (const { days, dateStr } of datesToCheck) {
      // Query milestones for this date
      // For recurring milestones, we need to check month and day
      const { data: milestones, error: milestonesError } = await supabase
        .from("relationship_milestones")
        .select(`
          id,
          title,
          milestone_date,
          is_recurring,
          partner_link_id
        `)
        .eq("milestone_date", dateStr);

      if (milestonesError) {
        console.error("Error fetching milestones:", milestonesError);
        continue;
      }

      if (!milestones || milestones.length === 0) {
        continue;
      }

      console.log(`Found ${milestones.length} milestones for ${dateStr} (${days} days away)`);

      for (const milestone of milestones) {
        // Get partner link to find both users
        const { data: partnerLink, error: linkError } = await supabase
          .from("partner_links")
          .select("user_id, partner_id")
          .eq("id", milestone.partner_link_id)
          .eq("status", "accepted")
          .single();

        if (linkError || !partnerLink) {
          console.log(`Partner link not found or not active for milestone ${milestone.id}`);
          continue;
        }

        const userIds = [partnerLink.user_id, partnerLink.partner_id].filter(Boolean);
        let usersNotified = 0;

        for (const userId of userIds) {
          // Check if user has SMS notifications enabled for milestones
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("phone_number, phone_verified, sms_notifications_enabled, sms_notification_preferences")
            .eq("user_id", userId)
            .single();

          if (profileError || !profile) {
            console.log(`Profile not found for user ${userId}`);
            continue;
          }

          if (!profile.phone_number || !profile.phone_verified) {
            console.log(`User ${userId} has no verified phone`);
            continue;
          }

          if (profile.sms_notifications_enabled === false) {
            console.log(`User ${userId} has SMS notifications disabled`);
            continue;
          }

          const preferences = profile.sms_notification_preferences as Record<string, boolean> | null;
          if (preferences && preferences.milestoneReminder === false) {
            console.log(`User ${userId} has milestone reminders disabled`);
            continue;
          }

          // Create reminder message
          const daysText = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
          const message = `💜 Luna: Reminder - "${milestone.title}" is ${daysText}! 💕 Open Luna to celebrate together.`;

          try {
            await sendSms(profile.phone_number, message);
            usersNotified++;
            totalNotificationsSent++;
            console.log(`Sent reminder to user ${userId} for milestone "${milestone.title}"`);
          } catch (smsError) {
            console.error(`Failed to send SMS to user ${userId}:`, smsError);
          }
        }

        results.push({
          milestone: milestone.title,
          usersNotified,
          daysUntil: days,
        });
      }
    }

    console.log(`Milestone reminders complete. Total notifications sent: ${totalNotificationsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalNotificationsSent,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in milestone-reminders function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

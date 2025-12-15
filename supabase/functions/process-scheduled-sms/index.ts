import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing scheduled SMS...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending scheduled messages that are due
    const { data: scheduledMessages, error: fetchError } = await supabase
      .from("scheduled_sms")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching scheduled messages:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledMessages?.length || 0} pending scheduled messages`);

    let sentCount = 0;
    let failedCount = 0;

    for (const sms of scheduledMessages || []) {
      try {
        let users: { user_id: string; phone_number: string }[] = [];

        // Determine recipients based on recipient_type
        if (sms.recipient_type === "all") {
          const { data } = await supabase
            .from("profiles")
            .select("user_id, phone_number")
            .eq("phone_verified", true)
            .eq("sms_notifications_enabled", true)
            .not("phone_number", "is", null);
          users = data || [];
        } else if (sms.recipient_type === "couples") {
          // Get users with couples subscription
          const { data: subscriptions } = await supabase
            .from("user_subscriptions")
            .select(`
              user_id,
              subscription_tiers!inner(slug)
            `)
            .eq("status", "active")
            .eq("subscription_tiers.slug", "couples");

          if (subscriptions && subscriptions.length > 0) {
            const userIds = subscriptions.map(s => s.user_id);
            const { data } = await supabase
              .from("profiles")
              .select("user_id, phone_number")
              .eq("phone_verified", true)
              .eq("sms_notifications_enabled", true)
              .not("phone_number", "is", null)
              .in("user_id", userIds);
            users = data || [];
          }
        } else if (sms.recipient_type === "personal") {
          // Get users without couples subscription (free/personal users)
          const { data: couplesSubscriptions } = await supabase
            .from("user_subscriptions")
            .select("user_id")
            .eq("status", "active");

          const couplesUserIds = couplesSubscriptions?.map(s => s.user_id) || [];

          const { data } = await supabase
            .from("profiles")
            .select("user_id, phone_number")
            .eq("phone_verified", true)
            .eq("sms_notifications_enabled", true)
            .not("phone_number", "is", null);

          users = (data || []).filter(u => !couplesUserIds.includes(u.user_id));
        } else {
          // Single recipient - phone_number field contains the actual phone
          users = [{ user_id: sms.created_by, phone_number: sms.phone_number }];
        }

        console.log(`Sending to ${users.length} recipients`);

        let messageSent = false;
        let lastError = null;

        for (const user of users) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
            const formData = new URLSearchParams();
            formData.append('To', user.phone_number);
            formData.append('From', twilioPhoneNumber);
            formData.append('Body', sms.message);

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData,
            });

            const twilioResult = await twilioResponse.json();

            // Log delivery
            await supabase
              .from("sms_delivery_logs")
              .insert({
                user_id: user.user_id,
                phone_number: user.phone_number,
                message: sms.message,
                status: twilioResponse.ok ? "delivered" : "failed",
                twilio_sid: twilioResult.sid || null,
                error_message: twilioResult.message || null,
              });

            if (twilioResponse.ok) {
              messageSent = true;
              sentCount++;
            } else {
              lastError = twilioResult.message;
              failedCount++;
            }
          } catch (sendError: any) {
            lastError = sendError?.message || "Send error";
            failedCount++;
            console.error(`Error sending to ${user.phone_number}:`, sendError);
          }
        }

        // Update scheduled SMS status
        await supabase
          .from("scheduled_sms")
          .update({
            status: messageSent ? "sent" : "failed",
            sent_at: new Date().toISOString(),
            error_message: lastError,
          })
          .eq("id", sms.id);

      } catch (smsError: any) {
        console.error(`Error processing scheduled SMS ${sms.id}:`, smsError);
        
        // Mark as failed
        await supabase
          .from("scheduled_sms")
          .update({
            status: "failed",
            error_message: smsError?.message || "Unknown error",
          })
          .eq("id", sms.id);
      }
    }

    console.log(`Scheduled SMS processing complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scheduledMessages?.length || 0,
        sent: sentCount, 
        failed: failedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error processing scheduled SMS:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

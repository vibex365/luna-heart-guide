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
    console.log("Starting daily affirmations job...");

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

    // Check if daily affirmations are enabled
    const { data: settings } = await supabase
      .from("luna_config")
      .select("value")
      .eq("key", "daily_affirmations_settings")
      .maybeSingle();

    const isEnabled = settings?.value?.enabled ?? true;
    if (!isEnabled) {
      console.log("Daily affirmations are disabled");
      return new Response(
        JSON.stringify({ message: "Daily affirmations are disabled" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active affirmation templates
    const { data: personalTemplates } = await supabase
      .from("daily_affirmation_templates")
      .select("message")
      .eq("is_active", true)
      .eq("account_type", "personal");

    const { data: couplesTemplates } = await supabase
      .from("daily_affirmation_templates")
      .select("message")
      .eq("is_active", true)
      .eq("account_type", "couples");

    if ((!personalTemplates || personalTemplates.length === 0) && 
        (!couplesTemplates || couplesTemplates.length === 0)) {
      console.log("No active affirmation templates found");
      return new Response(
        JSON.stringify({ message: "No active templates" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch users with verified phone numbers who have SMS enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        phone_number,
        display_name
      `)
      .eq("phone_verified", true)
      .eq("sms_notifications_enabled", true)
      .not("phone_number", "is", null);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users with verified phones`);

    let sentCount = 0;
    let failedCount = 0;

    for (const user of users || []) {
      try {
        // Check if user has couples subscription
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select(`
            tier_id,
            subscription_tiers!inner(slug)
          `)
          .eq("user_id", user.user_id)
          .eq("status", "active")
          .maybeSingle();

        const tierData = subscription?.subscription_tiers as any;
        const isCouples = tierData?.slug === "couples";
        const templates = isCouples ? couplesTemplates : personalTemplates;

        if (!templates || templates.length === 0) {
          console.log(`No templates for ${isCouples ? 'couples' : 'personal'} account type`);
          continue;
        }

        // Pick a random template
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        
        // Personalize message with opt-out footer
        let message = randomTemplate.message;
        if (user.display_name) {
          message = `Hi ${user.display_name}! ${message}`;
        }
        // Add opt-out instruction at the end
        message = `💜 Luna: ${message}\n\nReply STOP to unsubscribe`;

        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', user.phone_number);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        const twilioResult = await twilioResponse.json();

        // Log the delivery
        await supabase
          .from("sms_delivery_logs")
          .insert({
            user_id: user.user_id,
            phone_number: user.phone_number,
            message: message,
            status: twilioResponse.ok ? "delivered" : "failed",
            twilio_sid: twilioResult.sid || null,
            error_message: twilioResult.message || null,
          });

        if (twilioResponse.ok) {
          sentCount++;
          console.log(`Sent affirmation to ${user.phone_number}`);
        } else {
          failedCount++;
          console.error(`Failed to send to ${user.phone_number}:`, twilioResult.message);
        }
      } catch (userError) {
        failedCount++;
        console.error(`Error processing user ${user.user_id}:`, userError);
      }
    }

    console.log(`Daily affirmations complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error in daily affirmations:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

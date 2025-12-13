import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  action: "send-verification" | "verify-code" | "send-notification";
  userId?: string;
  phoneNumber?: string;
  code?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SendSmsRequest = await req.json();
    const { action, userId, phoneNumber, code, message } = body;

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

    // Generate 6-digit code
    const generateCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    if (action === "send-verification") {
      if (!userId || !phoneNumber) {
        return new Response(
          JSON.stringify({ error: "userId and phoneNumber required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone number format - must start with + and have 8-15 digits
      const cleaned = phoneNumber.replace(/[^\d+]/g, "");
      if (!cleaned.startsWith("+") || cleaned.length < 9 || cleaned.length > 16) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number format. Use international format: +[country code][number]" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = cleaned;

      // Rate limiting: Check if user sent a code in the last 60 seconds
      const { data: recentCode } = await supabase
        .from("sms_verification_codes")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 60000).toISOString())
        .limit(1);

      if (recentCode && recentCode.length > 0) {
        return new Response(
          JSON.stringify({ error: "Please wait 60 seconds before requesting a new code" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate and store verification code
      const verificationCode = generateCode();

      await supabase
        .from("sms_verification_codes")
        .insert({
          user_id: userId,
          phone_number: formattedPhone,
          code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });

      // Send SMS
      await sendSms(formattedPhone, `Your Luna verification code is: ${verificationCode}. This code expires in 10 minutes.`);

      console.log(`Verification code sent to ${formattedPhone} for user ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-code") {
      if (!userId || !phoneNumber || !code) {
        return new Response(
          JSON.stringify({ error: "userId, phoneNumber, and code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone format
      const cleaned = phoneNumber.replace(/[^\d+]/g, "");
      if (!cleaned.startsWith("+")) {
        return new Response(
          JSON.stringify({ error: "Invalid phone format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = cleaned;

      // Find valid verification code
      const { data: verification, error: verifyError } = await supabase
        .from("sms_verification_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("phone_number", formattedPhone)
        .eq("code", code)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verifyError || !verification) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark code as verified
      await supabase
        .from("sms_verification_codes")
        .update({ verified: true })
        .eq("id", verification.id);

      // Update user profile with verified phone
      await supabase
        .from("profiles")
        .update({ 
          phone_number: formattedPhone,
          phone_verified: true 
        })
        .eq("user_id", userId);

      console.log(`Phone verified for user ${userId}: ${formattedPhone}`);

      return new Response(
        JSON.stringify({ success: true, message: "Phone number verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send-notification") {
      if (!userId || !message) {
        return new Response(
          JSON.stringify({ error: "userId and message required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's verified phone number
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone_number, phone_verified")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile?.phone_number || !profile?.phone_verified) {
        console.log(`User ${userId} has no verified phone number`);
        return new Response(
          JSON.stringify({ error: "User has no verified phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send notification SMS
      await sendSms(profile.phone_number, message);

      console.log(`Notification sent to user ${userId}: ${message.substring(0, 50)}...`);

      return new Response(
        JSON.stringify({ success: true, message: "Notification sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-sms function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

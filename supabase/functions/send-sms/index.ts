import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  action: "send-verification" | "verify-code" | "send-notification" | "send-direct" | "send-welcome";
  userId?: string;
  phoneNumber?: string;
  code?: string;
  message?: string;
  email?: string;
  password?: string;
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
    const { action, userId, phoneNumber, code, message, email, password } = body;

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

      // Validate phone number format - must be exactly +[digits only], 8-15 digits
      const phoneRegex = /^\+[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number. Use format: +1234567890 (country code + number, digits only)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = phoneNumber;

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

      const { error: insertError } = await supabase
        .from("sms_verification_codes")
        .insert({
          user_id: userId,
          phone_number: formattedPhone,
          code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });

      if (insertError) {
        console.error("Failed to store verification code:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate verification code. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send SMS
      await sendSms(formattedPhone, `Your Luna verification code is: ${verificationCode}. This code expires in 10 minutes.`);

      console.log(`Verification code sent to ${formattedPhone} for user ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-code") {
      if (!phoneNumber || !code) {
        return new Response(
          JSON.stringify({ error: "phoneNumber and code required" }),
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

      // Find valid verification code - match by phone number and code only
      // This allows verification even if the temp user ID changed (page refresh, etc.)
      const { data: verification, error: verifyError } = await supabase
        .from("sms_verification_codes")
        .select("*")
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

    if (action === "send-direct") {
      // SECURITY: Require admin authentication for direct SMS sending
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        console.log("send-direct attempted without auth header");
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Authentication required' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        console.log("send-direct: Invalid auth token");
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify admin role
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminRole) {
        console.log(`send-direct: Non-admin user ${authUser.id} attempted access`);
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!phoneNumber || !message) {
        return new Response(
          JSON.stringify({ error: "phoneNumber and message required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone number format - must be exactly +[digits only], 8-15 digits
      const phoneRegex = /^\+[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number. Use format: +1234567890 (country code + number, digits only, no spaces or letters)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: max 10 direct SMS per admin per hour
      const { data: recentSms } = await supabase
        .from('sms_delivery_logs')
        .select('sent_at')
        .eq('template_name', 'admin_direct')
        .gte('sent_at', new Date(Date.now() - 3600000).toISOString());

      if (recentSms && recentSms.length >= 10) {
        console.log(`send-direct: Rate limit exceeded for admin ${authUser.id}`);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Max 10 direct SMS per hour.' }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send direct SMS (admin only)
      const result = await sendSms(phoneNumber, message);

      // Log the SMS send for audit trail
      await supabase.from('sms_delivery_logs').insert({
        phone_number: phoneNumber,
        template_name: 'admin_direct',
        status: 'sent',
        message_content: message.substring(0, 100) // Store first 100 chars for audit
      });

      console.log(`Direct SMS sent by admin ${authUser.id} to ${phoneNumber}`);

      return new Response(
        JSON.stringify({ success: true, message: "SMS sent", sid: result.sid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send-welcome") {
      // SECURITY: Require valid authentication token (user just signed up)
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        console.log("send-welcome attempted without auth header");
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Authentication required' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        console.log("send-welcome: Invalid auth token");
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the email matches the authenticated user (prevent sending to arbitrary emails)
      if (authUser.email !== email) {
        console.log(`send-welcome: Email mismatch - auth: ${authUser.email}, requested: ${email}`);
        return new Response(
          JSON.stringify({ error: 'Email does not match authenticated user' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!phoneNumber || !email || !password) {
        return new Response(
          JSON.stringify({ error: "phoneNumber, email, and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: max 2 welcome SMS per user (prevent abuse)
      const { data: existingWelcome } = await supabase
        .from('sms_delivery_logs')
        .select('id')
        .eq('phone_number', phoneNumber)
        .eq('template_name', 'welcome')
        .gte('sent_at', new Date(Date.now() - 86400000).toISOString()); // Last 24 hours

      if (existingWelcome && existingWelcome.length >= 2) {
        console.log(`send-welcome: Rate limit - phone ${phoneNumber} already received 2 welcome SMS`);
        return new Response(
          JSON.stringify({ error: 'Welcome SMS already sent to this number' }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send welcome SMS with login credentials
      const welcomeMessage = `Welcome to Luna! 💜\n\nYour login details:\nEmail: ${email}\nPassword: ${password}\n\nLogin at: https://talkswithluna.com/auth\n\nYour emotional wellness journey starts now!`;
      
      await sendSms(phoneNumber, welcomeMessage);

      // Log the welcome SMS
      await supabase.from('sms_delivery_logs').insert({
        phone_number: phoneNumber,
        template_name: 'welcome',
        status: 'sent'
      });

      console.log(`Welcome SMS sent to ${phoneNumber} for authenticated user ${authUser.id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Welcome SMS sent" }),
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

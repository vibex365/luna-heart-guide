import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This endpoint handles Twilio webhook for incoming SMS
    // When users reply with STOP, UNSUBSCRIBE, etc., Twilio sends a webhook
    
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio sends form-urlencoded data
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else if (contentType.includes('application/json')) {
      body = await req.json();
    }

    console.log('Received SMS opt-out webhook:', JSON.stringify(body));

    const from = body.From || body.from;
    const messageBody = (body.Body || body.body || '').toLowerCase().trim();
    
    if (!from) {
      return new Response(
        JSON.stringify({ error: 'Missing phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up phone number format
    const phoneNumber = from.startsWith('+') ? from : `+${from}`;

    // Check for opt-out keywords
    const optOutKeywords = ['stop', 'unsubscribe', 'quit', 'cancel', 'end', 'stopall'];
    const optInKeywords = ['start', 'yes', 'unstop', 'subscribe'];

    const isOptOut = optOutKeywords.some(keyword => messageBody === keyword);
    const isOptIn = optInKeywords.some(keyword => messageBody === keyword);

    if (!isOptOut && !isOptIn) {
      console.log(`Message "${messageBody}" is not an opt-out/opt-in request`);
      return new Response(
        JSON.stringify({ message: 'Not an opt-out/opt-in request', received: messageBody }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, sms_notifications_enabled')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (profileError) {
      console.error('Error finding profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.log(`No profile found for phone number: ${phoneNumber}`);
      return new Response(
        JSON.stringify({ message: 'No matching user found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user's SMS notification preference
    const newSmsEnabled = isOptIn;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        sms_notifications_enabled: newSmsEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update preferences' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this action
    await supabase.from('sms_delivery_logs').insert({
      user_id: profile.user_id,
      phone_number: phoneNumber,
      message: isOptOut ? 'User opted out of SMS' : 'User opted back in to SMS',
      status: 'delivered',
      sent_by: null,
    });

    console.log(`Successfully ${isOptOut ? 'opted out' : 'opted in'} user ${profile.user_id}`);

    // Return TwiML response to confirm the action to the user
    const responseMessage = isOptOut 
      ? "You've been unsubscribed from Luna SMS notifications. Reply START to re-subscribe."
      : "Welcome back! You've been re-subscribed to Luna SMS notifications. Reply STOP to unsubscribe.";

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error processing SMS opt-out:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

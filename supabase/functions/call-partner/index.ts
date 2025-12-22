import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { partnerLinkId } = await req.json();
    
    if (!partnerLinkId) {
      throw new Error('Partner link ID required');
    }

    // Get the partner link to find partner's user ID
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .select('user_id, partner_id')
      .eq('id', partnerLinkId)
      .single();

    if (linkError || !partnerLink) {
      throw new Error('Partner link not found');
    }

    // Determine which user is the partner
    const partnerId = partnerLink.user_id === user.id 
      ? partnerLink.partner_id 
      : partnerLink.user_id;

    if (!partnerId) {
      throw new Error('Partner not linked yet');
    }

    // Get partner's phone number from profiles
    const { data: partnerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, display_name')
      .eq('user_id', partnerId)
      .single();

    if (profileError || !partnerProfile?.phone_number) {
      return new Response(
        JSON.stringify({ 
          error: 'Partner phone number not found',
          needsPhone: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get caller's display name
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    const callerName = callerProfile?.display_name || 'Your partner';
    const partnerPhone = partnerProfile.phone_number;

    // Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error('Twilio not configured');
    }

    // Create TwiML message
    const twiml = `
      <Response>
        <Say voice="alice">
          Hi! ${callerName} wants to start a couples therapy session with Luna. 
          Open your Luna app to join them for a meaningful conversation together.
          This call will end now. See you in the app!
        </Say>
        <Pause length="1"/>
        <Say voice="alice">Goodbye!</Say>
      </Response>
    `.trim();

    // Make Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', partnerPhone);
    formData.append('From', twilioPhone);
    formData.append('Twiml', twiml);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      throw new Error(twilioResult.message || 'Failed to initiate call');
    }

    console.log('Call initiated:', twilioResult.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: twilioResult.sid,
        message: `Calling ${partnerProfile.display_name || 'your partner'}...`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in call-partner:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

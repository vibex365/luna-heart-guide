import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VOICE-SESSION-START] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { sessionType = 'solo', partnerLinkId } = await req.json();
    logStep("Request params", { sessionType, partnerLinkId });

    // Check user's minutes balance
    const { data: minutesData, error: minutesError } = await supabaseClient
      .from('user_minutes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (minutesError && minutesError.code !== 'PGRST116') {
      logStep("Error fetching minutes", { error: minutesError });
      throw new Error("Failed to check minutes balance");
    }

    let minutesBalance = minutesData?.minutes_balance || 0;
    logStep("Minutes balance", { minutesBalance });

    // If no minutes record exists, create one
    if (!minutesData) {
      const { error: insertError } = await supabaseClient
        .from('user_minutes')
        .insert({
          user_id: userId,
          minutes_balance: 0,
          lifetime_purchased: 0,
          lifetime_used: 0
        });
      
      if (insertError) {
        logStep("Error creating minutes record", { error: insertError });
      }
    }

    // Check if user has enough minutes (need at least 1 minute)
    if (minutesBalance < 1) {
      logStep("Insufficient minutes");
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_MINUTES",
        message: "You need Luna Minutes to start a voice session. Add more minutes to continue.",
        minutesBalance: 0
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For couples sessions, validate the partner link
    if (sessionType === 'couples' && partnerLinkId) {
      const { data: linkData, error: linkError } = await supabaseClient
        .from('partner_links')
        .select('*')
        .eq('id', partnerLinkId)
        .eq('status', 'accepted')
        .single();

      if (linkError || !linkData) {
        throw new Error("Invalid or inactive partner link");
      }

      // Verify user is part of this link
      if (linkData.user_id !== userId && linkData.partner_id !== userId) {
        throw new Error("Not authorized for this partner link");
      }

      logStep("Partner link validated", { partnerLinkId });
    }

    // Create voice session record
    const { data: session, error: sessionError } = await supabaseClient
      .from('voice_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        partner_link_id: sessionType === 'couples' ? partnerLinkId : null,
        status: 'initiated',
        start_time: new Date().toISOString(),
        metadata: {
          started_at: new Date().toISOString(),
          initial_balance: minutesBalance
        }
      })
      .select()
      .single();

    if (sessionError) {
      logStep("Error creating session", { error: sessionError });
      throw new Error("Failed to create voice session");
    }

    logStep("Session created", { sessionId: session.id });

    // Get user's profile for personalization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    return new Response(JSON.stringify({
      sessionId: session.id,
      sessionType,
      minutesBalance,
      userName: profile?.display_name || null,
      status: 'initiated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

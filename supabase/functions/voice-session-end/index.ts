import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COST_PER_MINUTE_CENTS = 25; // $0.25 per minute

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VOICE-SESSION-END] ${step}${detailsStr}`);
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

    const { sessionId, durationSeconds, summary, userTranscript, lunaTranscript, structuredTranscript, audioUrl } = await req.json();
    logStep("Request params", { sessionId, durationSeconds, hasTranscripts: !!userTranscript || !!lunaTranscript, hasStructured: !!structuredTranscript, hasAudio: !!audioUrl });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Get the session
    const { data: session, error: sessionError } = await supabaseClient
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Verify ownership
    if (session.user_id !== userId) {
      throw new Error("Not authorized to end this session");
    }

    // Calculate billing
    const actualDuration = durationSeconds || 0;
    const minutesBilled = Math.ceil(actualDuration / 60); // Round up to nearest minute
    const costCents = minutesBilled * COST_PER_MINUTE_CENTS;
    
    logStep("Billing calculated", { actualDuration, minutesBilled, costCents });

    // Get current minutes balance
    const { data: minutesData, error: minutesError } = await supabaseClient
      .from('user_minutes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (minutesError) {
      logStep("Error fetching minutes", { error: minutesError });
    }

    const currentBalance = minutesData?.minutes_balance || 0;
    const newBalance = Math.max(0, currentBalance - minutesBilled);
    const actualMinutesDeducted = Math.min(currentBalance, minutesBilled);

    logStep("Balance update", { currentBalance, newBalance, actualMinutesDeducted });

    // Update the session
    const { error: updateSessionError } = await supabaseClient
      .from('voice_sessions')
      .update({
        status: 'ended',
        end_time: new Date().toISOString(),
        duration_seconds: actualDuration,
        minutes_billed: actualMinutesDeducted,
        cost_cents: actualMinutesDeducted * COST_PER_MINUTE_CENTS,
        luna_context_summary: summary || null,
        transcript: userTranscript || null,
        luna_transcript: lunaTranscript || null,
        structured_transcript: structuredTranscript || [],
        audio_url: audioUrl || null,
        metadata: {
          ...session.metadata,
          ended_at: new Date().toISOString(),
          final_balance: newBalance
        }
      })
      .eq('id', sessionId);

    if (updateSessionError) {
      logStep("Error updating session", { error: updateSessionError });
      throw new Error("Failed to update session");
    }

    // Deduct minutes from wallet
    if (actualMinutesDeducted > 0) {
      const { error: updateMinutesError } = await supabaseClient
        .from('user_minutes')
        .update({
          minutes_balance: newBalance,
          lifetime_used: (minutesData?.lifetime_used || 0) + actualMinutesDeducted
        })
        .eq('user_id', userId);

      if (updateMinutesError) {
        logStep("Error updating minutes", { error: updateMinutesError });
      }

      // Record the transaction
      const { error: transactionError } = await supabaseClient
        .from('minute_transactions')
        .insert({
          user_id: userId,
          amount: -actualMinutesDeducted,
          transaction_type: 'usage',
          description: `Voice session ${session.session_type}`,
          voice_session_id: sessionId
        });

      if (transactionError) {
        logStep("Error recording transaction", { error: transactionError });
      }
    }

    logStep("Session ended successfully", { sessionId, minutesBilled: actualMinutesDeducted });

    return new Response(JSON.stringify({
      sessionId,
      durationSeconds: actualDuration,
      minutesBilled: actualMinutesDeducted,
      costCents: actualMinutesDeducted * COST_PER_MINUTE_CENTS,
      newBalance,
      status: 'ended'
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

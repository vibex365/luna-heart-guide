import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  subscriber_id: string;
  first_name: string | null;
  segment: string;
  status: string;
  created_at: string;
  last_interaction_at: string;
}

interface SegmentData {
  slug: string;
  cta_text: string;
}

const getFollowUpMessage = (segment: string, firstName: string): { message: string; buttonText: string } => {
  const name = firstName || "Hey";
  
  const messages: Record<string, { message: string; buttonText: string }> = {
    overthinking: {
      message: `${name}, just checking in 💭

Still stuck in that mental loop? Luna's helped thousands of women quiet the noise.

One conversation could change how you feel tonight.

Ready to try?`,
      buttonText: "Talk to Luna Now",
    },
    breakup: {
      message: `${name}, thinking of you 💔

Healing isn't linear. Some days are harder than others.

Luna's here whenever you need someone who actually listens.

No pressure. Just support.`,
      buttonText: "Start Healing",
    },
    anxiety: {
      message: `${name}, just wanted to check in 💕

That anxious feeling doesn't have to control you.

Luna can help you find some calm tonight.

Want to give it a try?`,
      buttonText: "Find Calm",
    },
  };

  return messages[segment] || messages.overthinking;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Lead Follow-up] Starting follow-up sequence");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find leads that:
    // 1. Are still "new" status
    // 2. Were created more than 24 hours ago
    // 3. Haven't been followed up yet
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: leadsToFollowUp, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "new")
      .lt("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("[Lead Follow-up] Error fetching leads:", fetchError);
      throw fetchError;
    }

    if (!leadsToFollowUp?.length) {
      console.log("[Lead Follow-up] No leads to follow up");
      return new Response(
        JSON.stringify({ message: "No leads to follow up", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Lead Follow-up] Found ${leadsToFollowUp.length} leads to follow up`);

    const appUrl = "https://luna.app"; // Replace with actual production URL
    const followUpResults: Array<{ subscriber_id: string; segment: string; message: string; buttonUrl: string }> = [];

    for (const lead of leadsToFollowUp) {
      const followUp = getFollowUpMessage(lead.segment, lead.first_name || "");
      const buttonUrl = `${appUrl}/dm?segment=${lead.segment}&utm_source=instagram&utm_medium=dm&utm_campaign=followup`;

      // Update lead status to followed_up
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          status: "followed_up",
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateError) {
        console.error(`[Lead Follow-up] Error updating lead ${lead.id}:`, updateError);
        continue;
      }

      // Track the follow-up event
      await supabase.from("funnel_events").insert({
        event_type: "followup_sent",
        funnel_type: "dm",
        segment: lead.segment,
        utm_source: "instagram",
        utm_medium: "dm",
        utm_campaign: "followup",
        session_id: lead.subscriber_id,
      });

      followUpResults.push({
        subscriber_id: lead.subscriber_id,
        segment: lead.segment,
        message: followUp.message,
        buttonUrl,
      });

      console.log(`[Lead Follow-up] Prepared follow-up for subscriber ${lead.subscriber_id}`);
    }

    // Return the follow-up messages for ManyChat to send
    // In production, you would integrate with ManyChat's API to send these
    return new Response(
      JSON.stringify({
        message: "Follow-ups prepared",
        processed: followUpResults.length,
        followUps: followUpResults,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Lead Follow-up] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

const sendManyChatMessage = async (
  subscriberId: string,
  message: string,
  buttonText: string,
  buttonUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // ManyChat Send Content API
    const response = await fetch(`https://api.manychat.com/fb/subscriber/sendContent`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        data: {
          version: "v2",
          content: {
            messages: [
              {
                type: "text",
                text: message,
                buttons: [
                  {
                    type: "url",
                    caption: buttonText,
                    url: buttonUrl,
                  },
                ],
              },
            ],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ManyChat API] Error response:`, response.status, errorText);
      return { success: false, error: `ManyChat API error: ${response.status}` };
    }

    const result = await response.json();
    console.log(`[ManyChat API] Success for subscriber ${subscriberId}:`, result);
    return { success: true };
  } catch (error) {
    console.error(`[ManyChat API] Exception:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Lead Follow-up] Starting follow-up sequence");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const manyChatApiKey = Deno.env.get("MANYCHAT_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!manyChatApiKey) {
      console.error("[Lead Follow-up] MANYCHAT_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "ManyChat API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        JSON.stringify({ message: "No leads to follow up", processed: 0, sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Lead Follow-up] Found ${leadsToFollowUp.length} leads to follow up`);

    const appUrl = "https://luna.app"; // Replace with actual production URL
    const results = {
      sent: 0,
      failed: 0,
      details: [] as Array<{ subscriber_id: string; success: boolean; error?: string }>,
    };

    for (const lead of leadsToFollowUp) {
      const followUp = getFollowUpMessage(lead.segment, lead.first_name || "");
      const buttonUrl = `${appUrl}/dm?segment=${lead.segment}&utm_source=instagram&utm_medium=dm&utm_campaign=followup`;

      // Send the actual DM via ManyChat API
      const sendResult = await sendManyChatMessage(
        lead.subscriber_id,
        followUp.message,
        followUp.buttonText,
        buttonUrl,
        manyChatApiKey
      );

      results.details.push({
        subscriber_id: lead.subscriber_id,
        success: sendResult.success,
        error: sendResult.error,
      });

      if (sendResult.success) {
        results.sent++;
        
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

        console.log(`[Lead Follow-up] Successfully sent DM to subscriber ${lead.subscriber_id}`);
      } else {
        results.failed++;
        console.error(`[Lead Follow-up] Failed to send DM to subscriber ${lead.subscriber_id}: ${sendResult.error}`);
      }

      // Rate limiting: wait 100ms between API calls to avoid hitting limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[Lead Follow-up] Completed. Sent: ${results.sent}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        message: "Follow-up sequence completed",
        processed: leadsToFollowUp.length,
        sent: results.sent,
        failed: results.failed,
        details: results.details,
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

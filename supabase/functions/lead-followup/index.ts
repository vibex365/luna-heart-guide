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

type FollowUpType = "24h" | "72h";

const getFollowUpMessage = (segment: string, firstName: string, followUpType: FollowUpType): { message: string; buttonText: string } => {
  const name = firstName || "Hey";
  
  if (followUpType === "24h") {
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
  } else {
    // 72-hour follow-up messages - more urgent/valuable
    const messages: Record<string, { message: string; buttonText: string }> = {
      overthinking: {
        message: `${name}, one last thing 💭

I noticed you haven't tried Luna yet. And that's totally okay.

But I wanted you to know — the women who use Luna say it's like having a best friend who actually gets the overthinking brain.

This is your sign. No pressure, but maybe tonight's the night?

💕`,
        buttonText: "Try Luna Free",
      },
      breakup: {
        message: `${name}, sending you love 💔

It's been a few days since we connected. How are you holding up?

Luna's helped so many women through exactly what you're feeling. The 3am thoughts. The "what ifs."

You don't have to go through this alone.

💕`,
        buttonText: "Get Support Now",
      },
      anxiety: {
        message: `${name}, final check-in 💕

I know the anxious thoughts don't just stop. They're probably still there.

Luna has helped thousands of women find peace when everything feels uncertain.

One conversation. That's all it takes to start feeling better.

Ready?`,
        buttonText: "Start Feeling Better",
      },
    };
    return messages[segment] || messages.overthinking;
  }
};

const sendManyChatMessage = async (
  subscriberId: string,
  message: string,
  buttonText: string,
  buttonUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> => {
  try {
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
    // Parse request body for manual triggers
    let manualLeadIds: string[] | null = null;
    let forceFollowUpType: FollowUpType | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        manualLeadIds = body.lead_ids || null;
        forceFollowUpType = body.follow_up_type || null;
      } catch {
        // Empty body is fine for cron triggers
      }
    }

    console.log("[Lead Follow-up] Starting follow-up sequence", { manualLeadIds, forceFollowUpType });

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

    const appUrl = "https://luna.app";
    const results = {
      followUp24h: { sent: 0, failed: 0 },
      followUp72h: { sent: 0, failed: 0 },
      details: [] as Array<{ subscriber_id: string; type: string; success: boolean; error?: string }>,
    };

    // Manual trigger for specific leads
    if (manualLeadIds?.length) {
      console.log(`[Lead Follow-up] Manual trigger for ${manualLeadIds.length} leads`);
      
      const { data: manualLeads, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .in("id", manualLeadIds);

      if (fetchError) throw fetchError;

      for (const lead of manualLeads || []) {
        const followUpType = forceFollowUpType || "24h";
        const followUp = getFollowUpMessage(lead.segment, lead.first_name || "", followUpType);
        const buttonUrl = `${appUrl}/dm?segment=${lead.segment}&utm_source=instagram&utm_medium=dm&utm_campaign=followup_manual`;

        const sendResult = await sendManyChatMessage(
          lead.subscriber_id,
          followUp.message,
          followUp.buttonText,
          buttonUrl,
          manyChatApiKey
        );

        results.details.push({
          subscriber_id: lead.subscriber_id,
          type: `manual_${followUpType}`,
          success: sendResult.success,
          error: sendResult.error,
        });

        if (sendResult.success) {
          const newStatus = followUpType === "72h" ? "followed_up_72h" : "followed_up";
          await supabase
            .from("leads")
            .update({ status: newStatus, last_interaction_at: new Date().toISOString() })
            .eq("id", lead.id);

          await supabase.from("funnel_events").insert({
            event_type: `followup_${followUpType}_sent`,
            funnel_type: "dm",
            segment: lead.segment,
            utm_source: "instagram",
            utm_medium: "dm",
            utm_campaign: "followup_manual",
            session_id: lead.subscriber_id,
          });

          if (followUpType === "24h") results.followUp24h.sent++;
          else results.followUp72h.sent++;
        } else {
          if (followUpType === "24h") results.followUp24h.failed++;
          else results.followUp72h.failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(
        JSON.stringify({
          message: "Manual follow-up completed",
          ...results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Automated 24-hour follow-up
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: leads24h, error: fetchError24h } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "new")
      .lt("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError24h) throw fetchError24h;

    console.log(`[Lead Follow-up] Found ${leads24h?.length || 0} leads for 24h follow-up`);

    for (const lead of leads24h || []) {
      const followUp = getFollowUpMessage(lead.segment, lead.first_name || "", "24h");
      const buttonUrl = `${appUrl}/dm?segment=${lead.segment}&utm_source=instagram&utm_medium=dm&utm_campaign=followup_24h`;

      const sendResult = await sendManyChatMessage(
        lead.subscriber_id,
        followUp.message,
        followUp.buttonText,
        buttonUrl,
        manyChatApiKey
      );

      results.details.push({
        subscriber_id: lead.subscriber_id,
        type: "24h",
        success: sendResult.success,
        error: sendResult.error,
      });

      if (sendResult.success) {
        results.followUp24h.sent++;
        await supabase
          .from("leads")
          .update({ status: "followed_up", last_interaction_at: new Date().toISOString() })
          .eq("id", lead.id);

        await supabase.from("funnel_events").insert({
          event_type: "followup_24h_sent",
          funnel_type: "dm",
          segment: lead.segment,
          utm_source: "instagram",
          utm_medium: "dm",
          utm_campaign: "followup_24h",
          session_id: lead.subscriber_id,
        });
      } else {
        results.followUp24h.failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Automated 72-hour follow-up
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    
    const { data: leads72h, error: fetchError72h } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "followed_up")
      .lt("last_interaction_at", seventyTwoHoursAgo)
      .order("last_interaction_at", { ascending: true })
      .limit(50);

    if (fetchError72h) throw fetchError72h;

    console.log(`[Lead Follow-up] Found ${leads72h?.length || 0} leads for 72h follow-up`);

    for (const lead of leads72h || []) {
      const followUp = getFollowUpMessage(lead.segment, lead.first_name || "", "72h");
      const buttonUrl = `${appUrl}/dm?segment=${lead.segment}&utm_source=instagram&utm_medium=dm&utm_campaign=followup_72h`;

      const sendResult = await sendManyChatMessage(
        lead.subscriber_id,
        followUp.message,
        followUp.buttonText,
        buttonUrl,
        manyChatApiKey
      );

      results.details.push({
        subscriber_id: lead.subscriber_id,
        type: "72h",
        success: sendResult.success,
        error: sendResult.error,
      });

      if (sendResult.success) {
        results.followUp72h.sent++;
        await supabase
          .from("leads")
          .update({ status: "followed_up_72h", last_interaction_at: new Date().toISOString() })
          .eq("id", lead.id);

        await supabase.from("funnel_events").insert({
          event_type: "followup_72h_sent",
          funnel_type: "dm",
          segment: lead.segment,
          utm_source: "instagram",
          utm_medium: "dm",
          utm_campaign: "followup_72h",
          session_id: lead.subscriber_id,
        });
      } else {
        results.followUp72h.failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalSent = results.followUp24h.sent + results.followUp72h.sent;
    const totalFailed = results.followUp24h.failed + results.followUp72h.failed;

    console.log(`[Lead Follow-up] Completed. 24h: ${results.followUp24h.sent} sent, 72h: ${results.followUp72h.sent} sent`);

    return new Response(
      JSON.stringify({
        message: "Follow-up sequence completed",
        totalProcessed: (leads24h?.length || 0) + (leads72h?.length || 0),
        totalSent,
        totalFailed,
        ...results,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManyChatPayload {
  subscriber_id: string;
  first_name?: string;
  email?: string;
  keyword: string;
  phone?: string;
}

interface SegmentData {
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  pain_points: string[];
  cta_text: string;
}

const getPersonalizedResponse = (segment: SegmentData, firstName: string, appUrl: string): { message: string; buttonText: string; buttonUrl: string } => {
  const segmentUrl = `${appUrl}/dm?segment=${segment.slug}&utm_source=instagram&utm_medium=dm&utm_campaign=manychat`;

  const responses: Record<string, { message: string; buttonText: string }> = {
    overthinking: {
      message: `Hey ${firstName} 👋

That loop of replaying every conversation... analyzing every pause...

Luna gets it. She's an AI companion who helps you untangle the spiral without judgment.

Thousands of women use her at 2am when their brain won't stop.

Want to try her for 30 days?`,
      buttonText: segment.cta_text || "Talk to Luna Now",
    },
    breakup: {
      message: `Hey ${firstName} 💔

Breakups are hard. Especially when everyone says "just move on" but your heart isn't ready.

Luna is an AI companion who helps you heal at your own pace. No timeline. No judgment.

She's helped thousands of women process heartbreak when friends got tired of listening.

Ready to start healing?`,
      buttonText: segment.cta_text || "Start Healing with Luna",
    },
    anxiety: {
      message: `Hey ${firstName} 💕

That anxious feeling about where you stand in your relationship... the constant need for reassurance...

Luna understands. She's an AI companion designed to help you find calm in the uncertainty.

No judgment. Available 24/7 for those 3am spirals.

Want to feel more at peace?`,
      buttonText: segment.cta_text || "Find Calm with Luna",
    },
  };

  const response = responses[segment.slug] || responses.overthinking;
  
  return {
    message: response.message,
    buttonText: response.buttonText,
    buttonUrl: segmentUrl,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ManyChatPayload = await req.json();
    console.log("[ManyChat Webhook] Received payload:", JSON.stringify(payload));

    const { subscriber_id, first_name, email, keyword, phone } = payload;

    if (!subscriber_id || !keyword) {
      console.error("[ManyChat Webhook] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing subscriber_id or keyword" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map keyword to segment slug
    const keywordToSlug: Record<string, string> = {
      overthinking: "overthinking",
      breakup: "breakup",
      anxiety: "anxiety",
      "relationship anxiety": "anxiety",
    };

    const segmentSlug = keywordToSlug[keyword.toLowerCase()] || "overthinking";

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert lead data - update if exists, insert if new
    const { data: existingLead, error: findError } = await supabase
      .from("leads")
      .select("id, interaction_count")
      .eq("subscriber_id", subscriber_id)
      .eq("source", "manychat")
      .maybeSingle();

    if (findError) {
      console.error("[ManyChat Webhook] Error finding lead:", findError);
    }

    if (existingLead) {
      // Update existing lead
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          first_name: first_name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          segment: segmentSlug,
          utm_content: keyword,
          last_interaction_at: new Date().toISOString(),
          interaction_count: (existingLead.interaction_count || 1) + 1,
        })
        .eq("id", existingLead.id);

      if (updateError) {
        console.error("[ManyChat Webhook] Error updating lead:", updateError);
      } else {
        console.log("[ManyChat Webhook] Updated existing lead:", existingLead.id);
      }
    } else {
      // Insert new lead
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          subscriber_id,
          first_name,
          email,
          phone,
          segment: segmentSlug,
          source: "manychat",
          utm_source: "instagram",
          utm_medium: "dm",
          utm_campaign: "manychat",
          utm_content: keyword,
          status: "new",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[ManyChat Webhook] Error inserting lead:", insertError);
      } else {
        console.log("[ManyChat Webhook] Created new lead:", newLead?.id);
      }
    }

    // Track the funnel event
    const { error: trackError } = await supabase.from("funnel_events").insert({
      event_type: "manychat_trigger",
      funnel_type: "dm",
      segment: segmentSlug,
      utm_source: "instagram",
      utm_medium: "dm",
      utm_campaign: "manychat",
      utm_content: keyword,
      session_id: subscriber_id,
    });

    if (trackError) {
      console.error("[ManyChat Webhook] Error tracking event:", trackError);
    }

    // Fetch segment data from database
    const { data: segmentData, error: segmentError } = await supabase
      .from("dm_segments")
      .select("*")
      .eq("slug", segmentSlug)
      .eq("is_active", true)
      .single();

    if (segmentError) {
      console.error("[ManyChat Webhook] Segment not found:", segmentError);
    }

    const segment: SegmentData = segmentData || {
      slug: segmentSlug,
      name: segmentSlug.charAt(0).toUpperCase() + segmentSlug.slice(1),
      headline: "Stop Overthinking in 30 Days.",
      subheadline: "Your AI relationship companion.",
      pain_points: [],
      cta_text: "Talk to Luna Now",
    };

    // Generate personalized response
    const name = first_name || "friend";
    const appUrl = "https://talkswithluna.com";
    const response = getPersonalizedResponse(segment, name, appUrl);

    console.log("[ManyChat Webhook] Sending response for segment:", segmentSlug);

    // Return ManyChat-compatible response format
    return new Response(
      JSON.stringify({
        version: "v2",
        content: {
          messages: [
            {
              type: "text",
              text: response.message,
            },
            {
              type: "text",
              text: "👇 Tap below to start",
              buttons: [
                {
                  type: "url",
                  caption: response.buttonText,
                  url: response.buttonUrl,
                },
              ],
            },
          ],
          actions: [],
          quick_replies: [],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ManyChat Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

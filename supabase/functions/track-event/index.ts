import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoLocation {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { 
      session_id, 
      event_type, 
      event_name, 
      page_path, 
      element_id, 
      element_text,
      user_agent,
      referrer,
      event_data,
      user_id 
    } = body;

    if (!session_id || !event_type || !event_name) {
      return new Response(
        JSON.stringify({ error: "session_id, event_type, and event_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP from request headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";

    console.log(`[TrackEvent] Tracking event: ${event_type}/${event_name}, session: ${session_id}`);

    // Get geolocation for event
    let geoData: Partial<GeoLocation> = {};
    
    if (clientIP && clientIP !== "unknown" && clientIP !== "127.0.0.1") {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
        if (geoResponse.ok) {
          geoData = await geoResponse.json();
        }
      } catch (geoError) {
        console.error("[TrackEvent] Geolocation lookup failed:", geoError);
      }
    }

    // Insert tracking event
    const { data, error } = await supabase
      .from("tracking_events")
      .insert({
        session_id,
        event_type,
        event_name,
        page_path,
        element_id,
        element_text,
        ip_address: clientIP,
        city: geoData.city || null,
        region: geoData.region || null,
        country: geoData.country_name || null,
        country_code: geoData.country_code || null,
        user_agent,
        referrer,
        event_data: event_data || {},
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[TrackEvent] Database insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to track event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TrackEvent] Successfully tracked event: ${data.id}`);

    return new Response(
      JSON.stringify({ success: true, event_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[TrackEvent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

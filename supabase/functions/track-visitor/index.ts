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
  latitude: number;
  longitude: number;
  timezone: string;
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
    const { session_id, user_agent, referrer, page_path, user_id } = body;

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP from request headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";

    console.log(`[TrackVisitor] Tracking visitor with session: ${session_id}, IP: ${clientIP}`);

    // Get geolocation from ipapi.co (free tier, no API key needed)
    let geoData: Partial<GeoLocation> = {};
    
    if (clientIP && clientIP !== "unknown" && clientIP !== "127.0.0.1") {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
        if (geoResponse.ok) {
          geoData = await geoResponse.json();
          console.log(`[TrackVisitor] Geolocation data:`, geoData);
        }
      } catch (geoError) {
        console.error("[TrackVisitor] Geolocation lookup failed:", geoError);
      }
    }

    // Check if visitor is from California - block them
    if (geoData.region === "California" || geoData.country_code === "US" && geoData.region === "CA") {
      console.log(`[TrackVisitor] Blocking California visitor: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: "california_restriction",
          message: "Access restricted in your region due to local regulations."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert visitor location data
    const { data, error } = await supabase
      .from("visitor_locations")
      .insert({
        session_id,
        ip_address: clientIP,
        city: geoData.city || null,
        region: geoData.region || null,
        country: geoData.country_name || null,
        country_code: geoData.country_code || null,
        latitude: geoData.latitude || null,
        longitude: geoData.longitude || null,
        timezone: geoData.timezone || null,
        user_agent,
        referrer,
        page_path,
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[TrackVisitor] Database insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to track visitor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TrackVisitor] Successfully tracked visitor: ${data.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        visitor_id: data.id,
        location: {
          city: geoData.city,
          region: geoData.region,
          country: geoData.country_name,
          country_code: geoData.country_code
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[TrackVisitor] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

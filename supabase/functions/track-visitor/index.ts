import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoLocation {
  ip: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  org: string;
}

async function getGeolocation(ip: string): Promise<Partial<GeoLocation>> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    console.log("[TrackVisitor] Skipping geolocation for local/private IP:", ip);
    return {};
  }

  try {
    // Use ipapi.co for geolocation (free tier)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Luna-Tracker/1.0'
      }
    });
    
    if (!response.ok) {
      console.error("[TrackVisitor] Geolocation API error:", response.status);
      return {};
    }
    
    const data = await response.json();
    
    // Check for rate limiting or error response
    if (data.error) {
      console.error("[TrackVisitor] Geolocation API returned error:", data);
      return {};
    }
    
    console.log("[TrackVisitor] Geolocation success:", {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      org: data.org
    });
    
    return data;
  } catch (error) {
    console.error("[TrackVisitor] Geolocation fetch failed:", error);
    return {};
  }
}

function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Detect browser
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR/")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows NT 10")) os = "Windows 10";
  else if (ua.includes("Windows NT 11")) os = "Windows 11";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  // Detect device type
  if (ua.includes("Mobile") || ua.includes("Android") && !ua.includes("Tablet")) device = "Mobile";
  else if (ua.includes("Tablet") || ua.includes("iPad")) device = "Tablet";

  return { browser, os, device };
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

    // Get IP from request headers - try multiple headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    const clientIP = cfConnectingIp 
      || (forwardedFor?.split(",")[0]?.trim())
      || realIp 
      || "unknown";

    console.log(`[TrackVisitor] Session: ${session_id}, IP: ${clientIP}, Path: ${page_path}`);

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(user_agent || "");
    console.log(`[TrackVisitor] Device: ${deviceInfo.device}, Browser: ${deviceInfo.browser}, OS: ${deviceInfo.os}`);

    // Get geolocation data - await the result properly
    const geoData = await getGeolocation(clientIP);

    // Check if visitor is from California - block them
    const isCaliforniaRegion = geoData.region === "California" || geoData.region_code === "CA";
    const isUSA = geoData.country_code === "US" || geoData.country === "US";
    
    if (isCaliforniaRegion && isUSA) {
      console.log(`[TrackVisitor] BLOCKING California visitor: ${clientIP}, Region: ${geoData.region}`);
      
      // Still log the blocked visitor
      await supabase.from("visitor_locations").insert({
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
      });
      
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: "california_restriction",
          message: "Access restricted in your region due to local AI regulations."
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
        JSON.stringify({ error: "Failed to track visitor", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TrackVisitor] SUCCESS - ID: ${data.id}, City: ${geoData.city || 'unknown'}, Country: ${geoData.country_name || 'unknown'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        visitor_id: data.id,
        location: {
          city: geoData.city || null,
          region: geoData.region || null,
          country: geoData.country_name || null,
          country_code: geoData.country_code || null
        },
        device: deviceInfo
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF (smallest possible)
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
]);

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const src = url.searchParams.get("src") || "unknown"; // source: facebook, google, email, etc.
    const cid = url.searchParams.get("cid") || "unknown"; // campaign ID
    const uid = url.searchParams.get("uid") || null; // user ID (optional)

    // Get IP and user agent
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || null;

    console.log(`[TrackingPixel] Pixel view from source: ${src}, campaign: ${cid}, IP: ${clientIP}`);

    // Generate a session ID for the pixel view
    const sessionId = `pixel_${crypto.randomUUID().slice(0, 8)}`;

    // Get geolocation
    let geoData: Record<string, unknown> = {};
    
    if (clientIP && clientIP !== "unknown" && clientIP !== "127.0.0.1") {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
        if (geoResponse.ok) {
          geoData = await geoResponse.json();
        }
      } catch (geoError) {
        console.error("[TrackingPixel] Geolocation lookup failed:", geoError);
      }
    }

    // Log the pixel view as a tracking event
    const { error } = await supabase
      .from("tracking_events")
      .insert({
        session_id: sessionId,
        event_type: "pixel_view",
        event_name: `pixel_${src}`,
        page_path: referer,
        ip_address: clientIP,
        city: geoData.city || null,
        region: geoData.region || null,
        country: geoData.country_name || null,
        country_code: geoData.country_code || null,
        user_agent: userAgent,
        referrer: referer,
        event_data: {
          source: src,
          campaign_id: cid,
          user_id: uid,
          timestamp: new Date().toISOString()
        },
        user_id: null,
      });

    if (error) {
      console.error("[TrackingPixel] Database insert error:", error);
    } else {
      console.log(`[TrackingPixel] Successfully logged pixel view`);
    }

    // Return transparent 1x1 GIF
    return new Response(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        // Prevent caching to ensure each view is tracked
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("[TrackingPixel] Error:", error);
    // Still return the GIF even on error to prevent broken images
    return new Response(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
});

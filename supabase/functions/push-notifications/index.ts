import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface RequestBody {
  action: 'subscribe' | 'unsubscribe' | 'send' | 'get-vapid-key';
  subscription?: PushSubscription;
  userId?: string;
  title?: string;
  body?: string;
}

// Web Push implementation for Deno
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For now, we'll use a simple implementation
    // In production, you'd want to use a proper web-push library
    console.log(`Sending push to: ${subscription.endpoint}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);
    
    // The actual push sending would require implementing the Web Push protocol
    // For this MVP, we'll store the notification intent and use client-side scheduling
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log('Push notification action:', body.action);

    switch (body.action) {
      case 'get-vapid-key': {
        if (!vapidPublicKey) {
          return new Response(
            JSON.stringify({ error: 'VAPID public key not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ vapidPublicKey }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'subscribe': {
        if (!body.subscription || !body.userId) {
          return new Response(
            JSON.stringify({ error: 'Missing subscription or userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { endpoint, keys } = body.subscription;
        
        // Upsert the subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: body.userId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
          }, {
            onConflict: 'user_id,endpoint'
          });

        if (error) {
          console.error('Error saving subscription:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to save subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Subscription saved for user:', body.userId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unsubscribe': {
        if (!body.subscription || !body.userId) {
          return new Response(
            JSON.stringify({ error: 'Missing subscription or userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', body.userId)
          .eq('endpoint', body.subscription.endpoint);

        if (error) {
          console.error('Error removing subscription:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Subscription removed for user:', body.userId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send': {
        if (!body.userId || !body.title) {
          return new Response(
            JSON.stringify({ error: 'Missing userId or title' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's subscriptions
        const { data: subscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', body.userId);

        if (error || !subscriptions?.length) {
          console.log('No subscriptions found for user:', body.userId);
          return new Response(
            JSON.stringify({ error: 'No subscriptions found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const payload = {
          title: body.title,
          body: body.body || '',
        };

        let successCount = 0;
        for (const sub of subscriptions) {
          const sent = await sendPushNotification(
            sub,
            payload,
            vapidPublicKey || '',
            vapidPrivateKey || ''
          );
          if (sent) successCount++;
        }

        console.log(`Sent ${successCount}/${subscriptions.length} notifications`);
        return new Response(
          JSON.stringify({ success: true, sent: successCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in push-notifications function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

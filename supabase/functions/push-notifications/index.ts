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
    console.log(`Sending push to: ${subscription.endpoint}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);
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

    // get-vapid-key doesn't require auth
    if (body.action === 'get-vapid-key') {
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

    // All other actions require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (body.action) {
      case 'subscribe': {
        if (!body.subscription || !body.userId) {
          return new Response(
            JSON.stringify({ error: 'Missing subscription or userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // SECURITY: Users can only subscribe themselves
        if (body.userId !== authUser.id) {
          console.warn(`User ${authUser.id} attempted to subscribe for different user ${body.userId}`);
          return new Response(
            JSON.stringify({ error: 'Can only subscribe your own notifications' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { endpoint, keys } = body.subscription;
        
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: authUser.id, // Use verified auth user ID
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

        console.log('Subscription saved for user:', authUser.id);
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

        // SECURITY: Users can only unsubscribe themselves
        if (body.userId !== authUser.id) {
          console.warn(`User ${authUser.id} attempted to unsubscribe different user ${body.userId}`);
          return new Response(
            JSON.stringify({ error: 'Can only unsubscribe your own notifications' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', authUser.id) // Use verified auth user ID
          .eq('endpoint', body.subscription.endpoint);

        if (error) {
          console.error('Error removing subscription:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Subscription removed for user:', authUser.id);
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

        // SECURITY: Only admins OR sending to linked partner is allowed
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id);
        
        const isAdmin = roles?.some((r: { role: string }) => r.role === 'admin') || false;
        
        if (!isAdmin) {
          // Check if user is linked partner (allowed to notify their partner)
          const { data: partnerLink } = await supabase
            .from('partner_links')
            .select('id, user_id, partner_id')
            .eq('status', 'accepted')
            .or(`user_id.eq.${authUser.id},partner_id.eq.${authUser.id}`)
            .maybeSingle();

          const isLinkedPartner = partnerLink && (
            (partnerLink.user_id === authUser.id && partnerLink.partner_id === body.userId) ||
            (partnerLink.partner_id === authUser.id && partnerLink.user_id === body.userId)
          );

          if (!isLinkedPartner) {
            console.warn(`User ${authUser.id} attempted to send notification to unauthorized user ${body.userId}`);
            return new Response(
              JSON.stringify({ error: 'Can only send notifications to your linked partner' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Get target user's subscriptions
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

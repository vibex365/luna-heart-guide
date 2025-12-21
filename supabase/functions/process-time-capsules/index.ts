import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all capsules that are due for delivery
    const now = new Date().toISOString();
    const { data: pendingCapsules, error: fetchError } = await supabase
      .from('time_capsule_messages')
      .select(`
        *,
        sender:profiles!time_capsule_messages_sender_id_fkey(display_name),
        recipient:profiles!time_capsule_messages_recipient_id_fkey(display_name, phone_number)
      `)
      .eq('is_delivered', false)
      .lte('deliver_at', now);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingCapsules?.length || 0} capsules to deliver`);

    const results = [];

    for (const capsule of pendingCapsules || []) {
      try {
        // Mark as delivered
        const { error: updateError } = await supabase
          .from('time_capsule_messages')
          .update({
            is_delivered: true,
            delivered_at: now,
          })
          .eq('id', capsule.id);

        if (updateError) {
          throw updateError;
        }

        // Send SMS notification if recipient has phone
        const recipientPhone = capsule.recipient?.phone_number;
        const senderName = capsule.sender?.display_name || 'Your partner';

        if (recipientPhone) {
          try {
            await supabase.functions.invoke('send-sms', {
              body: {
                to: recipientPhone,
                message: `💌 ${senderName} sent you a Time Capsule message! Open the Luna app to read their love letter from the past. 💝`,
              },
            });
            console.log(`SMS sent to ${recipientPhone}`);
          } catch (smsError) {
            console.error('SMS failed:', smsError);
          }
        }

        // Send push notification
        try {
          await supabase.functions.invoke('push-notifications', {
            body: {
              userId: capsule.recipient_id,
              title: '💌 Time Capsule Arrived!',
              body: `${senderName} sent you a love letter from the past`,
              data: { type: 'time_capsule', capsuleId: capsule.id },
            },
          });
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
        }

        results.push({ id: capsule.id, status: 'delivered' });
      } catch (capsuleError: any) {
        console.error(`Failed to deliver capsule ${capsule.id}:`, capsuleError);
        results.push({ id: capsule.id, status: 'failed', error: capsuleError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Process time capsules error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

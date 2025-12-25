import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Create admin client for password changes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create regular client to verify the admin user
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user is an admin
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !adminUser) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { targetUserId, newPassword, sendSms } = await req.json();

    if (!targetUserId || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Admin ${adminUser.id} resetting password for user ${targetUserId}`);

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Password updated successfully');

    let smsSent = false;

    // Send SMS if requested
    if (sendSms) {
      // Get user's phone number
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('phone_number, phone_verified, display_name')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else if (!profile?.phone_number || !profile?.phone_verified) {
        console.log('User has no verified phone number');
      } else if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error('Twilio credentials not configured');
      } else {
        // Send SMS via Twilio
        const message = `Hi ${profile.display_name || 'there'}! Your Luna password has been reset. Your new password is: ${newPassword}\n\nPlease log in and change it to something you'll remember. 💜`;

        const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const formData = new URLSearchParams();
        formData.append('To', profile.phone_number);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (twilioResponse.ok) {
          console.log('SMS sent successfully');
          smsSent = true;
        } else {
          const twilioError = await twilioResponse.text();
          console.error('Twilio error:', twilioError);
        }
      }
    }

    // Log the admin action
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_id: adminUser.id,
      action_type: 'password_reset',
      target_user_id: targetUserId,
      details: { sms_sent: smsSent },
      reason: `Password reset by admin${smsSent ? ' (SMS sent)' : ''}`,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      smsSent,
      message: smsSent 
        ? 'Password updated and SMS sent successfully' 
        : 'Password updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-reset-password:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoodEntry {
  mood_level: number;
  mood_label: string;
  created_at: string;
}

interface AnalyticsEntry {
  module_activated: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  sms_notifications_enabled: boolean | null;
}

const moduleLabels: Record<string, string> = {
  "communication_coaching": "communication",
  "conflict_deescalation": "conflict resolution",
  "emotional_mirror": "emotions",
  "pattern_spotting": "patterns",
  "boundary_building": "boundaries",
  "breakup_healing": "healing",
  "self_worth": "self-worth",
  "general_support": "support"
};

function generateInsightsSms(
  displayName: string,
  moodEntries: MoodEntry[],
  analyticsEntries: AnalyticsEntry[]
): string {
  let message = `💜 Weekly Insights for ${displayName}!\n\n`;
  
  if (moodEntries.length > 0) {
    const avgMood = moodEntries.reduce((sum, e) => sum + e.mood_level, 0) / moodEntries.length;
    const moodTrend = avgMood >= 7 ? "great 😊" : avgMood >= 5 ? "balanced 🙂" : "challenging 💪";
    message += `🎭 Mood: ${moodTrend} (avg ${avgMood.toFixed(1)}/10)\n`;
  }

  if (analyticsEntries.length > 0) {
    const moduleCounts: Record<string, number> = {};
    analyticsEntries.forEach(e => {
      moduleCounts[e.module_activated] = (moduleCounts[e.module_activated] || 0) + 1;
    });
    
    const topModule = Object.entries(moduleCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    message += `💬 Focus: ${moduleLabels[topModule[0]] || topModule[0]} (${topModule[1]} chats)\n`;
  }

  message += `\n🌟 Keep taking care of yourself! Open Luna to continue your journey.`;

  return message;
}

async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[WEEKLY-INSIGHTS] Twilio credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WEEKLY-INSIGHTS] Twilio error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WEEKLY-INSIGHTS] Failed to send SMS:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    const isValidCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isValidServiceRequest = authHeader?.includes(Deno.env.get('SUPABASE_ANON_KEY') || '');
    
    if (!isValidCronRequest && !isValidServiceRequest) {
      console.error('[WEEKLY-INSIGHTS] Unauthorized request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[WEEKLY-INSIGHTS] Function started');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Get all users with weekly insights enabled AND verified phone
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_number, phone_verified, sms_notifications_enabled')
      .eq('weekly_insights_enabled', true);

    if (profilesError) {
      console.error('[WEEKLY-INSIGHTS] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`[WEEKLY-INSIGHTS] Processing ${profiles?.length || 0} users`);

    const results = [];

    for (const profile of (profiles as Profile[]) || []) {
      // Skip if no verified phone or SMS disabled
      if (!profile.phone_verified || !profile.sms_notifications_enabled || !profile.phone_number) {
        console.log(`[WEEKLY-INSIGHTS] Skipping ${profile.user_id} - no verified phone or SMS disabled`);
        continue;
      }

      // Get mood entries for this user from the past week
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_level, mood_label, created_at')
        .eq('user_id', profile.user_id)
        .gte('created_at', oneWeekAgoISO)
        .order('created_at', { ascending: false });

      // Get conversation analytics for this user from the past week
      const { data: analyticsEntries } = await supabase
        .from('conversation_analytics')
        .select('module_activated, created_at')
        .eq('user_id', profile.user_id)
        .gte('created_at', oneWeekAgoISO);

      const smsMessage = generateInsightsSms(
        profile.display_name || 'there',
        moodEntries || [],
        analyticsEntries || []
      );

      const sent = await sendSms(profile.phone_number, smsMessage);

      results.push({
        user_id: profile.user_id,
        display_name: profile.display_name,
        sms_sent: sent,
        mood_count: moodEntries?.length || 0,
        analytics_count: analyticsEntries?.length || 0
      });

      console.log(`[WEEKLY-INSIGHTS] SMS ${sent ? 'sent' : 'failed'} for user ${profile.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        smsSent: results.filter(r => r.sms_sent).length,
        insights: results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WEEKLY-INSIGHTS] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

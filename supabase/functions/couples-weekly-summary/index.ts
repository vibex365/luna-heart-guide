import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentData {
  communication_score: number;
  trust_score: number;
  intimacy_score: number;
  conflict_score: number;
  assessment_date: string;
}

interface SharedMoodData {
  mood_level: number;
  mood_label: string;
  user_id: string;
  created_at: string;
}

interface PartnerLink {
  id: string;
  user_id: string;
  partner_id: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  sms_notifications_enabled: boolean | null;
}

function calculateTrend(scores: number[]): { trend: 'up' | 'down' | 'stable'; change: number } {
  if (scores.length < 2) return { trend: 'stable', change: 0 };
  
  const recentAvg = scores.slice(0, Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(scores.length / 2);
  const olderAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
  
  const change = Math.round(recentAvg - olderAvg);
  
  if (change > 2) return { trend: 'up', change };
  if (change < -2) return { trend: 'down', change };
  return { trend: 'stable', change };
}

function getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
}

function generateSmsMessage(
  partnerName1: string,
  partnerName2: string,
  assessments: AssessmentData[],
  sharedMoods: SharedMoodData[],
  activitiesCount: number
): string {
  let message = `💕 Weekly Summary for ${partnerName1} & ${partnerName2}\n\n`;
  
  if (assessments.length > 0) {
    const latest = assessments[0];
    const avgScore = Math.round((latest.communication_score + latest.trust_score + latest.intimacy_score + latest.conflict_score) / 4);
    
    const communicationTrend = calculateTrend(assessments.map(a => a.communication_score));
    
    message += `💑 Health Score: ${avgScore}%\n`;
    message += `💬 Communication: ${getTrendEmoji(communicationTrend.trend)}\n`;
  }
  
  if (sharedMoods.length > 0) {
    const avgMood = Math.round(sharedMoods.reduce((sum, m) => sum + m.mood_level, 0) / sharedMoods.length * 10) / 10;
    message += `🎭 Avg Mood: ${avgMood}/10 (${sharedMoods.length} entries)\n`;
  }
  
  message += `\n🌟 Keep nurturing your connection! Open Luna to explore activities together.`;
  
  return message;
}

async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[COUPLES-WEEKLY-SUMMARY] Twilio credentials not configured');
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
      console.error('[COUPLES-WEEKLY-SUMMARY] Twilio error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[COUPLES-WEEKLY-SUMMARY] Failed to send SMS:', error);
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
      console.error('[COUPLES-WEEKLY-SUMMARY] Unauthorized request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[COUPLES-WEEKLY-SUMMARY] Function started');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    const { data: partnerLinks, error: linksError } = await supabase
      .from('partner_links')
      .select('id, user_id, partner_id')
      .eq('status', 'accepted');

    if (linksError) {
      console.error('[COUPLES-WEEKLY-SUMMARY] Error fetching partner links:', linksError);
      throw linksError;
    }

    console.log(`[COUPLES-WEEKLY-SUMMARY] Processing ${partnerLinks?.length || 0} couples`);

    const results = [];

    for (const link of (partnerLinks as PartnerLink[]) || []) {
      try {
        // Get profiles for both partners
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number, phone_verified, sms_notifications_enabled')
          .in('user_id', [link.user_id, link.partner_id]);

        const profile1 = (profiles as Profile[] || []).find(p => p.user_id === link.user_id);
        const profile2 = (profiles as Profile[] || []).find(p => p.user_id === link.partner_id);
        
        const name1 = profile1?.display_name || 'Partner 1';
        const name2 = profile2?.display_name || 'Partner 2';

        // Get assessments from past week
        const { data: assessments } = await supabase
          .from('relationship_assessments')
          .select('communication_score, trust_score, intimacy_score, conflict_score, assessment_date')
          .eq('partner_link_id', link.id)
          .gte('created_at', oneWeekAgoISO)
          .order('assessment_date', { ascending: false });

        // Get shared moods from past week
        const { data: sharedMoods } = await supabase
          .from('shared_mood_entries')
          .select('mood_level, mood_label, user_id, created_at')
          .eq('partner_link_id', link.id)
          .gte('created_at', oneWeekAgoISO);

        // Get completed activities count
        const { count: activitiesCount } = await supabase
          .from('completed_activities')
          .select('*', { count: 'exact', head: true })
          .eq('partner_link_id', link.id)
          .gte('completed_at', oneWeekAgoISO);

        const smsMessage = generateSmsMessage(
          name1,
          name2,
          (assessments as AssessmentData[]) || [],
          (sharedMoods as SharedMoodData[]) || [],
          activitiesCount || 0
        );

        const smsSent: string[] = [];

        // Send SMS to partner 1 if enabled
        if (profile1?.phone_verified && profile1?.sms_notifications_enabled && profile1?.phone_number) {
          const sent = await sendSms(profile1.phone_number, smsMessage);
          if (sent) smsSent.push(profile1.phone_number);
        }

        // Send SMS to partner 2 if enabled
        if (profile2?.phone_verified && profile2?.sms_notifications_enabled && profile2?.phone_number) {
          const sent = await sendSms(profile2.phone_number, smsMessage);
          if (sent) smsSent.push(profile2.phone_number);
        }

        console.log(`[COUPLES-WEEKLY-SUMMARY] SMS sent to: ${smsSent.join(', ') || 'none'}`);

        results.push({
          partner_link_id: link.id,
          sms_sent: smsSent,
          assessments_count: assessments?.length || 0,
          moods_count: sharedMoods?.length || 0,
        });

      } catch (coupleError) {
        console.error(`[COUPLES-WEEKLY-SUMMARY] Error processing couple ${link.id}:`, coupleError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[COUPLES-WEEKLY-SUMMARY] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

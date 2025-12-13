import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface ActivityData {
  title: string;
  category: string;
}

interface PartnerLink {
  id: string;
  user_id: string;
  partner_id: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
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

function getScoreEmoji(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
}

function getMoodEmoji(level: number): string {
  if (level >= 8) return '😊';
  if (level >= 6) return '🙂';
  if (level >= 4) return '😐';
  if (level >= 2) return '😔';
  return '😢';
}

function generateEmailHtml(
  partnerName1: string,
  partnerName2: string,
  assessments: AssessmentData[],
  sharedMoods: SharedMoodData[],
  suggestedActivities: ActivityData[]
): string {
  // Calculate trends for each category
  const communicationScores = assessments.map(a => a.communication_score);
  const trustScores = assessments.map(a => a.trust_score);
  const intimacyScores = assessments.map(a => a.intimacy_score);
  const conflictScores = assessments.map(a => a.conflict_score);
  
  const communicationTrend = calculateTrend(communicationScores);
  const trustTrend = calculateTrend(trustScores);
  const intimacyTrend = calculateTrend(intimacyScores);
  const conflictTrend = calculateTrend(conflictScores);
  
  // Calculate average mood
  const avgMood = sharedMoods.length > 0 
    ? Math.round(sharedMoods.reduce((sum, m) => sum + m.mood_level, 0) / sharedMoods.length * 10) / 10
    : 0;
  
  // Get latest scores
  const latestAssessment = assessments[0];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Relationship Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f4ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px;">💕 Weekly Relationship Summary</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${partnerName1} & ${partnerName2}</p>
      </td>
    </tr>
    
    <!-- Intro -->
    <tr>
      <td style="padding: 30px;">
        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
          Here's your relationship check-in for the past week. Keep nurturing your connection! 🌱
        </p>
      </td>
    </tr>
    
    ${latestAssessment ? `
    <!-- Health Score Trends -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px;">📊 Relationship Health Trends</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 15px; background-color: #f0f9ff; border-radius: 12px; margin-bottom: 10px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px;">💬 Communication</span><br>
                    <span style="color: #6b7280; font-size: 14px;">Score: ${latestAssessment.communication_score}%</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 24px;">${getScoreEmoji(communicationTrend.trend)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height: 10px;"></td></tr>
          <tr>
            <td style="padding: 15px; background-color: #f0fdf4; border-radius: 12px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px;">🛡️ Trust</span><br>
                    <span style="color: #6b7280; font-size: 14px;">Score: ${latestAssessment.trust_score}%</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 24px;">${getScoreEmoji(trustTrend.trend)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height: 10px;"></td></tr>
          <tr>
            <td style="padding: 15px; background-color: #fdf2f8; border-radius: 12px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px;">💖 Intimacy</span><br>
                    <span style="color: #6b7280; font-size: 14px;">Score: ${latestAssessment.intimacy_score}%</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 24px;">${getScoreEmoji(intimacyTrend.trend)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height: 10px;"></td></tr>
          <tr>
            <td style="padding: 15px; background-color: #faf5ff; border-radius: 12px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px;">✨ Conflict Resolution</span><br>
                    <span style="color: #6b7280; font-size: 14px;">Score: ${latestAssessment.conflict_score}%</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 24px;">${getScoreEmoji(conflictTrend.trend)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ` : `
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="padding: 20px; background-color: #fef3c7; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #92400e;">Complete your first relationship assessment together to see trends here!</p>
        </div>
      </td>
    </tr>
    `}
    
    <!-- Shared Moods -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px;">🎭 Mood Check-In</h2>
        ${sharedMoods.length > 0 ? `
        <div style="padding: 20px; background-color: #fefce8; border-radius: 12px; text-align: center;">
          <span style="font-size: 48px;">${getMoodEmoji(avgMood)}</span>
          <p style="margin: 10px 0 0; color: #374151; font-size: 18px;">
            Average mood this week: <strong>${avgMood}/10</strong>
          </p>
          <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
            ${sharedMoods.length} mood entries shared
          </p>
        </div>
        ` : `
        <div style="padding: 20px; background-color: #f3f4f6; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #6b7280;">No shared moods logged this week. Try checking in with each other!</p>
        </div>
        `}
      </td>
    </tr>
    
    <!-- Suggested Activities -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px;">💡 Try This Week</h2>
        ${suggestedActivities.slice(0, 3).map(activity => `
        <div style="padding: 15px; background-color: #ede9fe; border-radius: 12px; margin-bottom: 10px;">
          <p style="margin: 0; color: #5b21b6; font-weight: 600;">${activity.title}</p>
          <p style="margin: 5px 0 0; color: #7c3aed; font-size: 12px; text-transform: uppercase;">${activity.category}</p>
        </div>
        `).join('')}
      </td>
    </tr>
    
    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 40px; text-align: center;">
        <a href="https://luna-app.lovable.app/couples" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Open Couples Dashboard →
        </a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          You're receiving this because you have a couples account with Luna.<br>
          Keep nurturing your connection! 💕
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate scheduled/cron requests
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
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range for past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Get all active partner links
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
        // Get user emails from auth
        const { data: userData1 } = await supabase.auth.admin.getUserById(link.user_id);
        const { data: userData2 } = await supabase.auth.admin.getUserById(link.partner_id);
        
        if (!userData1?.user?.email || !userData2?.user?.email) {
          console.log(`[COUPLES-WEEKLY-SUMMARY] Skipping link ${link.id} - missing email`);
          continue;
        }

        // Get profiles for display names
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', [link.user_id, link.partner_id]);

        const profile1 = (profiles as Profile[] || []).find(p => p.user_id === link.user_id);
        const profile2 = (profiles as Profile[] || []).find(p => p.user_id === link.partner_id);
        
        const name1 = profile1?.display_name || userData1.user.email.split('@')[0];
        const name2 = profile2?.display_name || userData2.user.email.split('@')[0];

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

        // Get suggested activities
        const { data: activities } = await supabase
          .from('shared_activities')
          .select('title, category')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(5);

        // Shuffle activities to get random suggestions
        const shuffled = (activities as ActivityData[] || []).sort(() => Math.random() - 0.5);

        const emailHtml = generateEmailHtml(
          name1,
          name2,
          (assessments as AssessmentData[]) || [],
          (sharedMoods as SharedMoodData[]) || [],
          shuffled
        );

        // Send email to both partners
        const emailAddresses = [userData1.user.email, userData2.user.email];
        
        const emailResponse = await resend.emails.send({
          from: 'Luna <onboarding@resend.dev>',
          to: emailAddresses,
          subject: `💕 Your Weekly Relationship Summary - ${name1} & ${name2}`,
          html: emailHtml,
        });

        console.log(`[COUPLES-WEEKLY-SUMMARY] Email sent to ${emailAddresses.join(', ')}:`, emailResponse);

        results.push({
          partner_link_id: link.id,
          emails_sent: emailAddresses,
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

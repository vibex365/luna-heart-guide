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

function generateInsightsSummary(
  moodEntries: MoodEntry[],
  analyticsEntries: AnalyticsEntry[]
): { title: string; body: string } {
  // Calculate mood trend
  let moodInsight = "";
  if (moodEntries.length > 0) {
    const avgMood = moodEntries.reduce((sum, e) => sum + e.mood_level, 0) / moodEntries.length;
    const moodTrend = avgMood >= 7 ? "great" : avgMood >= 5 ? "balanced" : "challenging";
    moodInsight = `Your mood has been ${moodTrend} this week (avg: ${avgMood.toFixed(1)}/10). `;
  }

  // Find top conversation module
  let moduleInsight = "";
  if (analyticsEntries.length > 0) {
    const moduleCounts: Record<string, number> = {};
    analyticsEntries.forEach(e => {
      moduleCounts[e.module_activated] = (moduleCounts[e.module_activated] || 0) + 1;
    });
    
    const topModule = Object.entries(moduleCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    const moduleLabels: Record<string, string> = {
      "communication_coaching": "communication skills",
      "conflict_deescalation": "conflict resolution",
      "emotional_mirror": "emotional processing",
      "pattern_spotting": "pattern recognition",
      "boundary_building": "boundary setting",
      "breakup_healing": "healing & recovery",
      "self_worth": "self-worth building",
      "general_support": "general support"
    };
    
    moduleInsight = `You focused most on ${moduleLabels[topModule[0]] || topModule[0]} (${topModule[1]} conversations).`;
  }

  const title = "Your Weekly Luna Insights 💜";
  const body = moodInsight + moduleInsight || "Keep checking in with Luna to build your insights!";

  return { title, body };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate scheduled/cron requests
    // This function should only be called by Supabase Cron or with a valid secret
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // Allow requests with valid cron secret OR service role key
    const isValidCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isValidServiceRequest = authHeader?.includes(Deno.env.get('SUPABASE_ANON_KEY') || '');
    
    if (!isValidCronRequest && !isValidServiceRequest) {
      console.error('Unauthorized request to weekly-insights function');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. This endpoint requires authentication.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Weekly insights function authenticated successfully');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the date range for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Get all users with weekly insights notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('weekly_insights_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Processing weekly insights for ${profiles?.length || 0} users`);

    const results = [];

    for (const profile of profiles || []) {
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

      const { title, body } = generateInsightsSummary(
        moodEntries || [],
        analyticsEntries || []
      );

      results.push({
        user_id: profile.user_id,
        display_name: profile.display_name,
        title,
        body,
        mood_count: moodEntries?.length || 0,
        analytics_count: analyticsEntries?.length || 0
      });

      console.log(`Generated insights for user ${profile.user_id}: ${body}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        insights: results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating weekly insights:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Suggestion mappings based on conversation themes
const SUGGESTION_MAPPINGS: Record<string, { text: string; actionHint: string; type: string }> = {
  // Love languages
  physical_touch: {
    text: "Your partner may appreciate some extra physical affection today — a hug, holding hands, or a gentle touch.",
    actionHint: "Try initiating a warm embrace or holding hands during your next moment together.",
    type: "physical_touch"
  },
  words_of_affirmation: {
    text: "A sincere compliment or words of appreciation could really brighten your partner's day. 💜",
    actionHint: "Tell them something specific you love or appreciate about them.",
    type: "words_of_affirmation"
  },
  quality_time: {
    text: "Your partner might be craving some quality time together. Consider putting away distractions and being fully present.",
    actionHint: "Plan 30 minutes of uninterrupted time together tonight.",
    type: "quality_time"
  },
  acts_of_service: {
    text: "Small acts of service can speak volumes. Consider doing something helpful without being asked.",
    actionHint: "Take care of a chore or task your partner usually handles.",
    type: "acts_of_service"
  },
  receiving_gifts: {
    text: "A thoughtful gesture, even something small, could make your partner feel special today.",
    actionHint: "Surprise them with their favorite snack or a small meaningful token.",
    type: "receiving_gifts"
  },
  
  // Emotional states
  feeling_unheard: {
    text: "Take a moment to really listen to your partner today. They may need to feel truly heard.",
    actionHint: "Ask how they're feeling and give them your full, undivided attention.",
    type: "communication"
  },
  stress_support: {
    text: "Your partner might be going through a stressful time. A little extra patience and support could help.",
    actionHint: "Ask if there's anything you can do to help lighten their load.",
    type: "support"
  },
  appreciation_needed: {
    text: "Everyone needs to feel valued. Consider expressing gratitude for something your partner does.",
    actionHint: "Thank them for something specific they've done recently.",
    type: "appreciation"
  },
  connection_seeking: {
    text: "Your partner may be seeking deeper connection. Consider having a meaningful conversation tonight.",
    actionHint: "Ask about their dreams, fears, or what's been on their mind lately.",
    type: "connection"
  },
  
  // Luna modules
  communication_coaching: {
    text: "Good communication is on your partner's mind. Be open and patient in your conversations today.",
    actionHint: "Practice active listening and validate their feelings before responding.",
    type: "communication"
  },
  emotional_mirror: {
    text: "Your partner may be processing some complex emotions. A supportive presence can help.",
    actionHint: "Simply be there. Sometimes presence matters more than words.",
    type: "emotional_support"
  },
  self_worth: {
    text: "A little encouragement and validation could mean a lot to your partner right now.",
    actionHint: "Remind them of their strengths and what makes them special to you.",
    type: "affirmation"
  },
  boundary_building: {
    text: "Respecting boundaries is important. Consider asking what your partner needs from you.",
    actionHint: "Have an open conversation about each other's needs and limits.",
    type: "boundaries"
  },
  pattern_spotting: {
    text: "Reflect together on your relationship patterns. Growth happens when you work as a team.",
    actionHint: "Share one thing you'd both like to improve together.",
    type: "growth"
  }
};

// Keywords to detect themes from conversation content
const THEME_KEYWORDS: Record<string, string[]> = {
  physical_touch: ['physical touch', 'touch', 'hug', 'cuddle', 'intimacy', 'physical affection', 'holding hands', 'kissing'],
  words_of_affirmation: ['words of affirmation', 'compliment', 'praise', 'tell me', 'say', 'verbal', 'appreciation words'],
  quality_time: ['quality time', 'spend time', 'together', 'date', 'attention', 'present', 'focused'],
  acts_of_service: ['acts of service', 'help', 'chores', 'tasks', 'doing things', 'service'],
  receiving_gifts: ['gifts', 'surprise', 'thoughtful', 'present', 'token'],
  feeling_unheard: ['not listening', 'ignored', 'unheard', "doesn't listen", 'not heard', 'dismissive'],
  stress_support: ['stressed', 'overwhelmed', 'anxious', 'pressure', 'too much'],
  appreciation_needed: ['unappreciated', 'taken for granted', 'not valued', 'invisible'],
  connection_seeking: ['disconnect', 'distant', 'apart', 'miss', 'closer', 'connection'],
};

// Sensitive topics to skip
const SENSITIVE_TOPICS = ['breakup', 'divorce', 'crisis', 'suicide', 'abuse', 'cheating', 'affair'];

function detectThemes(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const detectedThemes: string[] = [];
  
  // Check for sensitive topics first
  for (const topic of SENSITIVE_TOPICS) {
    if (lowerContent.includes(topic)) {
      console.log(`Skipping suggestion generation - sensitive topic detected: ${topic}`);
      return []; // Return empty to skip suggestion generation
    }
  }
  
  // Check for theme keywords
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        detectedThemes.push(theme);
        break; // Only add each theme once
      }
    }
  }
  
  return detectedThemes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, conversationId, moduleActivated } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating suggestions for user ${userId}, module: ${moduleActivated}`);

    // Check if user has a linked partner
    const { data: partnerLink, error: linkError } = await supabase
      .from('partner_links')
      .select('id, user_id, partner_id')
      .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('status', 'accepted')
      .single();

    if (linkError || !partnerLink) {
      console.log('No linked partner found, skipping suggestion generation');
      return new Response(
        JSON.stringify({ message: 'No linked partner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine who the partner is
    const partnerId = partnerLink.user_id === userId ? partnerLink.partner_id : partnerLink.user_id;

    // Check for recent suggestions to avoid spamming
    const { data: recentSuggestions } = await supabase
      .from('partner_suggestions')
      .select('id, suggestion_type')
      .eq('partner_link_id', partnerLink.id)
      .eq('for_user_id', partnerId)
      .eq('is_dismissed', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentSuggestions && recentSuggestions.length >= 2) {
      console.log('Partner already has 2+ active suggestions, skipping');
      return new Response(
        JSON.stringify({ message: 'Max suggestions reached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent messages from this conversation to detect themes
    let detectedThemes: string[] = [];
    
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messages) {
        const userMessages = messages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' ');
        
        detectedThemes = detectThemes(userMessages);
      }
    }

    // Also consider the module activated from Luna
    if (moduleActivated && SUGGESTION_MAPPINGS[moduleActivated]) {
      if (!detectedThemes.includes(moduleActivated)) {
        detectedThemes.push(moduleActivated);
      }
    }

    if (detectedThemes.length === 0) {
      console.log('No actionable themes detected');
      return new Response(
        JSON.stringify({ message: 'No themes detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing suggestion types to avoid duplicates
    const existingTypes = recentSuggestions?.map(s => s.suggestion_type) || [];
    
    // Find a theme that hasn't been suggested recently
    const newTheme = detectedThemes.find(t => !existingTypes.includes(t));
    
    if (!newTheme || !SUGGESTION_MAPPINGS[newTheme]) {
      console.log('No new suggestion themes available');
      return new Response(
        JSON.stringify({ message: 'No new themes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestion = SUGGESTION_MAPPINGS[newTheme];

    // Insert the suggestion
    const { data: insertedSuggestion, error: insertError } = await supabase
      .from('partner_suggestions')
      .insert({
        partner_link_id: partnerLink.id,
        for_user_id: partnerId,
        from_user_id: userId,
        suggestion_type: suggestion.type,
        suggestion_text: suggestion.text,
        action_hint: suggestion.actionHint,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting suggestion:', insertError);
      throw insertError;
    }

    console.log(`Created suggestion for partner: ${suggestion.type}`);

    return new Response(
      JSON.stringify({ success: true, suggestion: insertedSuggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-partner-suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { motion } from "framer-motion";
import { Heart, TrendingUp, Calendar, MessageCircle, Users, Activity, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface PartnerProfile {
  gender: string | null;
  sexual_orientation: string | null;
  display_name: string | null;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Not specified",
};

const ORIENTATION_LABELS: Record<string, string> = {
  straight: "Straight",
  gay: "Gay",
  lesbian: "Lesbian",
  bisexual: "Bisexual",
  pansexual: "Pansexual",
  asexual: "Asexual",
  "prefer-not-to-say": "Not specified",
};

const getRelationshipType = (user1Gender: string | null, user2Gender: string | null, user1Orientation: string | null) => {
  if (!user1Gender || !user2Gender) return null;
  
  const sameGender = user1Gender === user2Gender;
  
  if (sameGender) {
    if (user1Gender === "male") return "same-sex male";
    if (user1Gender === "female") return "same-sex female";
    return "same-gender";
  }
  
  return "mixed-gender";
};

const getPersonalizedInsight = (
  relationshipType: string | null,
  overallScore: number,
  topMetric: string,
  bottomMetric: string
) => {
  const insights: Record<string, string[]> = {
    "same-sex male": [
      "Research shows same-sex male couples often excel at direct communication. Keep building on that strength!",
      "Consider dedicating time for emotional check-ins — studies show it strengthens intimacy in male couples.",
      "Your partnership thrives when you both feel heard. Try the 'speaker-listener' technique this week.",
    ],
    "same-sex female": [
      "Female couples often show high emotional attunement. Use this to navigate challenges together.",
      "Watch for 'fusion' patterns — maintaining individual identities strengthens your bond.",
      "Your empathy is a superpower. Channel it into understanding each other's love languages.",
    ],
    "mixed-gender": [
      "Bridge communication style differences by asking 'what do you need right now — solutions or support?'",
      "Research shows mixed-gender couples benefit from explicit appreciation. Try daily gratitude sharing.",
      "Different emotional processing speeds are normal. Give each other space while staying connected.",
    ],
    default: [
      "Every relationship is unique. Focus on what works for you both.",
      "Regular check-ins strengthen any partnership. Consider a weekly 'relationship review'.",
      "Your commitment to growth is what matters most. Keep showing up for each other.",
    ],
  };

  const typeInsights = insights[relationshipType || "default"] || insights.default;
  
  // Pick insight based on score and metrics
  if (overallScore >= 80) return typeInsights[0];
  if (overallScore >= 60) return typeInsights[1];
  return typeInsights[2];
};

export const WeeklyRelationshipSummary = () => {
  const { user } = useAuth();
  const { partnerLink, healthScore, isLinked, partnerId } = useCouplesAccount();

  // Fetch both partners' profiles for gender/orientation
  const { data: partnerProfiles } = useQuery({
    queryKey: ["partner-profiles", user?.id, partnerId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const userIds = [user.id];
      if (partnerId) userIds.push(partnerId);

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, gender, sexual_orientation, display_name")
        .in("user_id", userIds);
      
      if (error) throw error;
      
      const profiles: Record<string, PartnerProfile> = {};
      data?.forEach((p) => {
        profiles[p.user_id] = {
          gender: p.gender,
          sexual_orientation: p.sexual_orientation,
          display_name: p.display_name,
        };
      });
      
      return profiles;
    },
    enabled: !!user?.id,
  });

  // Fetch this week's shared moods
  const { data: weeklyMoods = [] } = useQuery({
    queryKey: ["weekly-shared-moods", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from("shared_mood_entries")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerLink,
  });

  // Fetch this week's completed activities
  const { data: weeklyActivities = [] } = useQuery({
    queryKey: ["weekly-completed-activities", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from("completed_activities")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .gte("completed_at", weekStart.toISOString())
        .lte("completed_at", weekEnd.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerLink,
  });

  if (!isLinked) return null;

  const userProfile = user?.id && partnerProfiles ? partnerProfiles[user.id] : null;
  const partnerProfile = partnerId && partnerProfiles ? partnerProfiles[partnerId] : null;

  const relationshipType = getRelationshipType(
    userProfile?.gender || null,
    partnerProfile?.gender || null,
    userProfile?.sexual_orientation || null
  );

  const overallScore = healthScore?.overall_score ?? 
    Math.round(
      ((healthScore?.communication_score ?? 50) +
        (healthScore?.trust_score ?? 50) +
        (healthScore?.intimacy_score ?? 50) +
        (healthScore?.conflict_resolution_score ?? 50)) / 4
    );

  const weekRange = `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")}`;

  const metrics = [
    {
      label: "Communication",
      value: healthScore?.communication_score ?? 50,
      icon: MessageCircle,
      color: "text-blue-500",
    },
    {
      label: "Trust",
      value: healthScore?.trust_score ?? 50,
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Intimacy",
      value: healthScore?.intimacy_score ?? 50,
      icon: Heart,
      color: "text-pink-500",
    },
    {
      label: "Conflict Resolution",
      value: healthScore?.conflict_resolution_score ?? 50,
      icon: Activity,
      color: "text-purple-500",
    },
  ];

  const sortedMetrics = [...metrics].sort((a, b) => b.value - a.value);
  const topMetric = sortedMetrics[0]?.label || "Communication";
  const bottomMetric = sortedMetrics[sortedMetrics.length - 1]?.label || "Communication";

  const personalizedInsight = getPersonalizedInsight(relationshipType, overallScore, topMetric, bottomMetric);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Weekly Summary
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {weekRange}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Partner Info */}
        {(userProfile || partnerProfile) && (
          <div className="flex items-center justify-center gap-4 py-2 border-b border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">You</p>
              <div className="flex gap-1 mt-1">
                {userProfile?.gender && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {GENDER_LABELS[userProfile.gender] || userProfile.gender}
                  </Badge>
                )}
              </div>
            </div>
            <Heart className="w-4 h-4 text-pink-500" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {partnerProfile?.display_name || "Partner"}
              </p>
              <div className="flex gap-1 mt-1">
                {partnerProfile?.gender && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {GENDER_LABELS[partnerProfile.gender] || partnerProfile.gender}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overall Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-3 py-2"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{overallScore}</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-1 -right-1"
            >
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-medium">Relationship Health</p>
            <p className="text-xs text-muted-foreground">
              {overallScore >= 80 ? "Thriving!" : overallScore >= 60 ? "Growing Strong" : overallScore >= 40 ? "Room to Grow" : "Needs Attention"}
            </p>
          </div>
        </motion.div>

        {/* Personalized Insight */}
        {personalizedInsight && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">{personalizedInsight}</p>
            </div>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-2 rounded-lg bg-background/50 border border-border/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <metric.icon className={`w-3 h-3 ${metric.color}`} />
                <span className="text-xs text-muted-foreground truncate">{metric.label}</span>
              </div>
              <Progress value={metric.value} className="h-1.5" />
              <span className="text-xs font-medium mt-1 block">{metric.value}%</span>
            </motion.div>
          ))}
        </div>

        {/* Weekly Activity Stats */}
        <div className="flex items-center justify-around pt-2 border-t border-border/50">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{weeklyMoods.length}</p>
            <p className="text-xs text-muted-foreground">Moods Shared</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{weeklyActivities.length}</p>
            <p className="text-xs text-muted-foreground">Activities Done</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

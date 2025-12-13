import { motion } from "framer-motion";
import { Heart, TrendingUp, Calendar, MessageCircle, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { startOfWeek, endOfWeek, format } from "date-fns";

export const WeeklyRelationshipSummary = () => {
  const { partnerLink, healthScore, isLinked } = useCouplesAccount();

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
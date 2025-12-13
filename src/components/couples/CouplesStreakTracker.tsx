import { motion } from "framer-motion";
import { Flame, Trophy, Star, Heart, Award, Crown, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  type: "streak" | "total";
  color: string;
}

const badges: Badge[] = [
  { id: "first-spark", name: "First Spark", description: "Complete your first activity together", icon: <Sparkles className="w-4 h-4" />, requirement: 1, type: "total", color: "from-yellow-400 to-orange-500" },
  { id: "getting-started", name: "Getting Started", description: "3-day streak", icon: <Flame className="w-4 h-4" />, requirement: 3, type: "streak", color: "from-orange-400 to-red-500" },
  { id: "week-warriors", name: "Week Warriors", description: "7-day streak", icon: <Star className="w-4 h-4" />, requirement: 7, type: "streak", color: "from-purple-400 to-pink-500" },
  { id: "dedicated-duo", name: "Dedicated Duo", description: "14-day streak", icon: <Heart className="w-4 h-4" />, requirement: 14, type: "streak", color: "from-pink-400 to-rose-500" },
  { id: "monthly-magic", name: "Monthly Magic", description: "30-day streak", icon: <Trophy className="w-4 h-4" />, requirement: 30, type: "streak", color: "from-amber-400 to-yellow-500" },
  { id: "activity-enthusiasts", name: "Activity Enthusiasts", description: "Complete 10 activities", icon: <Target className="w-4 h-4" />, requirement: 10, type: "total", color: "from-blue-400 to-cyan-500" },
  { id: "power-couple", name: "Power Couple", description: "Complete 25 activities", icon: <Award className="w-4 h-4" />, requirement: 25, type: "total", color: "from-emerald-400 to-green-500" },
  { id: "legendary-lovers", name: "Legendary Lovers", description: "Complete 50 activities", icon: <Crown className="w-4 h-4" />, requirement: 50, type: "total", color: "from-violet-400 to-purple-600" },
];

const milestones = [
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
  { days: 60, label: "2 months" },
  { days: 100, label: "100 days" },
];

interface CouplesStreakTrackerProps {
  partnerLinkId?: string;
}

export const CouplesStreakTracker = ({ partnerLinkId }: CouplesStreakTrackerProps) => {
  const { data: streakData, isLoading } = useQuery({
    queryKey: ["couples-streak", partnerLinkId],
    queryFn: async () => {
      if (!partnerLinkId) return null;
      
      const { data, error } = await supabase
        .from("couples_streaks")
        .select("*")
        .eq("partner_link_id", partnerLinkId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!partnerLinkId,
  });

  const currentStreak = streakData?.current_streak ?? 0;
  const longestStreak = streakData?.longest_streak ?? 0;
  const totalActivities = streakData?.total_activities_completed ?? 0;

  // Calculate earned badges
  const earnedBadges = badges.filter((badge) => {
    if (badge.type === "streak") {
      return longestStreak >= badge.requirement;
    }
    return totalActivities >= badge.requirement;
  });

  // Find next milestone
  const nextMilestone = milestones.find((m) => m.days > currentStreak);
  const prevMilestone = [...milestones].reverse().find((m) => m.days <= currentStreak);
  const progressToNext = nextMilestone
    ? ((currentStreak - (prevMilestone?.days ?? 0)) / (nextMilestone.days - (prevMilestone?.days ?? 0))) * 100
    : 100;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Couples Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Streak Display */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center">
              <motion.div
                className="relative"
                animate={{ scale: currentStreak > 0 ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{currentStreak}</span>
                    <Flame className="w-4 h-4 text-white mx-auto" />
                  </div>
                </div>
                {currentStreak >= 7 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Star className="w-3 h-3 text-yellow-800 fill-yellow-800" />
                  </motion.div>
                )}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">Current Streak</p>
            </div>

            <div className="h-16 w-px bg-border" />

            <div className="text-center space-y-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-bold">{longestStreak}</p>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Total Activities</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {prevMilestone?.label ?? "Start"}
              </span>
              <span className="text-primary font-medium">
                {nextMilestone.label}
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {nextMilestone.days - currentStreak} days until {nextMilestone.label} milestone!
            </p>
          </div>
        )}

        {/* Badges Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Badges ({earnedBadges.length}/{badges.length})
          </h4>
          
          <div className="grid grid-cols-4 gap-2">
            {badges.map((badge) => {
              const isEarned = earnedBadges.some((b) => b.id === badge.id);
              
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                      isEarned
                        ? `bg-gradient-to-br ${badge.color} shadow-lg`
                        : "bg-muted/50 opacity-40"
                    }`}
                  >
                    <div className={isEarned ? "text-white" : "text-muted-foreground"}>
                      {badge.icon}
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[120px]">
                    <p className="text-xs font-medium text-center">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Encouragement Message */}
        {currentStreak === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-center text-muted-foreground py-2"
          >
            Complete an activity together to start your streak! 🔥
          </motion.p>
        )}

        {currentStreak > 0 && currentStreak < 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-center text-muted-foreground py-2"
          >
            Keep it up! You're building momentum together! 💪
          </motion.p>
        )}

        {currentStreak >= 7 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-center text-primary py-2 font-medium"
          >
            Amazing! You two are relationship goals! 🌟
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
};

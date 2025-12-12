import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Calendar, Sparkles, Star, Award, Crown, Zap } from "lucide-react";
import { useStreakTracking } from "@/hooks/useStreakTracking";

interface Milestone {
  days: number;
  label: string;
  icon: typeof Star;
  color: string;
  bgColor: string;
}

const milestones: Milestone[] = [
  { days: 7, label: "Week Warrior", icon: Zap, color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { days: 14, label: "Fortnight Hero", icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/20" },
  { days: 30, label: "Monthly Master", icon: Award, color: "text-amber-500", bgColor: "bg-amber-500/20" },
  { days: 100, label: "Century Legend", icon: Crown, color: "text-rose-500", bgColor: "bg-rose-500/20" },
];

const StreakDisplay = () => {
  const { streakData, loading } = useStreakTracking();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    if (streakData?.currentStreak) {
      const milestone = milestones.find(m => m.days === streakData.currentStreak);
      if (milestone) {
        setCelebratingMilestone(milestone);
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [streakData?.currentStreak]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground text-center">
          Check-in Streak
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return "👑";
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "⭐";
    if (streak >= 7) return "⚡";
    if (streak >= 3) return "💪";
    return "🌱";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 100) return "Legendary dedication!";
    if (streak >= 30) return "Incredible consistency!";
    if (streak >= 14) return "Two weeks strong!";
    if (streak >= 7) return "One week warrior!";
    if (streak >= 3) return "Building momentum!";
    if (streak >= 1) return "Great start!";
    return "Start your streak today!";
  };

  const earnedMilestones = milestones.filter(m => streakData.longestStreak >= m.days);
  const nextMilestone = milestones.find(m => m.days > streakData.currentStreak);
  const progressToNext = nextMilestone 
    ? (streakData.currentStreak / nextMilestone.days) * 100 
    : 100;

  return (
    <div className="space-y-4 relative">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && celebratingMilestone && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6"][i % 5],
                  left: `${10 + (i * 7)}%`,
                }}
                initial={{ y: -20, opacity: 0, scale: 0 }}
                animate={{ 
                  y: [0, 150, 200],
                  opacity: [1, 1, 0],
                  scale: [0, 1.5, 0.5],
                  rotate: [0, 360, 720]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}

            <motion.div
              className="relative z-20 text-center p-6"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <celebratingMilestone.icon className={`w-16 h-16 mx-auto ${celebratingMilestone.color}`} />
              </motion.div>
              <motion.h3 
                className="font-heading text-2xl font-bold text-foreground mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                🎉 {celebratingMilestone.label}!
              </motion.h3>
              <motion.p 
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {celebratingMilestone.days} day streak achieved!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h3 className="font-heading text-lg font-semibold text-foreground text-center">
        Check-in Streak
      </h3>

      {/* Main Streak Display */}
      <motion.div
        className="flex flex-col items-center justify-center py-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="relative">
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center"
            animate={{
              boxShadow: streakData.currentStreak > 0 
                ? ["0 0 20px hsl(var(--accent) / 0.3)", "0 0 40px hsl(var(--accent) / 0.5)", "0 0 20px hsl(var(--accent) / 0.3)"]
                : "none"
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-center">
              <span className="text-3xl font-heading font-bold text-foreground">
                {streakData.currentStreak}
              </span>
              <span className="text-lg ml-1">{getStreakEmoji(streakData.currentStreak)}</span>
            </div>
          </motion.div>
          {streakData.currentStreak >= 7 && (
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Flame className="w-6 h-6 text-orange-500" />
            </motion.div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">day streak</p>
        <p className="text-xs text-accent font-medium mt-1">
          {getStreakMessage(streakData.currentStreak)}
        </p>
      </motion.div>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Next: {nextMilestone.label}</span>
            <span className="text-foreground font-medium">
              {streakData.currentStreak}/{nextMilestone.days} days
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Milestone Badges */}
      {earnedMilestones.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-muted-foreground text-center">Earned Badges</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {earnedMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.days}
                className={`${milestone.bgColor} rounded-xl p-3 flex flex-col items-center min-w-[70px]`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * index, type: "spring" }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <milestone.icon className={`w-6 h-6 ${milestone.color}`} />
                <span className="text-[10px] text-foreground font-medium mt-1 text-center leading-tight">
                  {milestone.label}
                </span>
                <span className="text-[9px] text-muted-foreground">{milestone.days}d</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Locked Milestones */}
      {milestones.length > earnedMilestones.length && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-muted-foreground text-center">Upcoming</p>
          <div className="flex justify-center gap-2">
            {milestones
              .filter(m => streakData.longestStreak < m.days)
              .slice(0, 2)
              .map((milestone) => (
                <div
                  key={milestone.days}
                  className="bg-muted/30 rounded-xl p-2 flex items-center gap-2 opacity-50"
                >
                  <milestone.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{milestone.days}d</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <motion.div
          className="bg-secondary/50 rounded-xl p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="font-heading text-lg font-bold text-foreground">
            {streakData.longestStreak}
          </p>
          <p className="text-xs text-muted-foreground">Best streak</p>
        </motion.div>

        <motion.div
          className="bg-secondary/50 rounded-xl p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="font-heading text-lg font-bold text-foreground">
            {streakData.totalCheckIns}
          </p>
          <p className="text-xs text-muted-foreground">Total check-ins</p>
        </motion.div>

        <motion.div
          className="bg-secondary/50 rounded-xl p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-heading text-sm font-bold text-foreground">
            {streakData.lastCheckIn 
              ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                  Math.ceil((streakData.lastCheckIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                  'day'
                )
              : "-"
            }
          </p>
          <p className="text-xs text-muted-foreground">Last check-in</p>
        </motion.div>
      </div>
    </div>
  );
};

export default StreakDisplay;

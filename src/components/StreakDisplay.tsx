import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, Sparkles } from "lucide-react";
import { useStreakTracking } from "@/hooks/useStreakTracking";

const StreakDisplay = () => {
  const { streakData, loading } = useStreakTracking();

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
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "⚡";
    if (streak >= 7) return "✨";
    if (streak >= 3) return "💪";
    return "🌱";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Incredible dedication!";
    if (streak >= 14) return "Two weeks strong!";
    if (streak >= 7) return "One week warrior!";
    if (streak >= 3) return "Building momentum!";
    if (streak >= 1) return "Great start!";
    return "Start your streak today!";
  };

  return (
    <div className="space-y-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
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

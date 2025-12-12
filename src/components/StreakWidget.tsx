import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useStreakTracking } from "@/hooks/useStreakTracking";

const StreakWidget = () => {
  const { streakData, loading } = useStreakTracking();

  if (loading || !streakData) {
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

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 rounded-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      {streakData.currentStreak >= 7 ? (
        <Flame className="w-4 h-4 text-orange-500" />
      ) : (
        <span className="text-sm">{getStreakEmoji(streakData.currentStreak)}</span>
      )}
      <span className="text-sm font-semibold text-foreground">
        {streakData.currentStreak}
      </span>
      <span className="text-xs text-muted-foreground">day streak</span>
    </motion.div>
  );
};

export default StreakWidget;

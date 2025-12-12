import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown } from "lucide-react";
import { useStreakTracking } from "@/hooks/useStreakTracking";

const motivationalMessages: Record<string, string[]> = {
  zero: [
    "Every journey begins with a single step. Start yours today! 🌱",
    "Today is the perfect day to begin. You've got this! ✨",
    "Your future self will thank you for starting now. 💜",
  ],
  starting: [
    "You're building something beautiful. Keep going! 🌟",
    "Small steps lead to big changes. Proud of you! 💪",
    "You showed up today. That's what matters most. ✨",
  ],
  building: [
    "Look at you go! Momentum is on your side now. 🚀",
    "You're proving to yourself what you're capable of. 💜",
    "Consistency is your superpower. Keep wielding it! ⚡",
  ],
  week: [
    "A whole week! You're creating a real habit here. 🔥",
    "7 days of showing up for yourself. Incredible! 🌟",
    "You've built something meaningful this week. 💜",
  ],
  twoWeeks: [
    "Two weeks strong! This is who you are now. ⭐",
    "You're not just trying anymore - you're doing. 💪",
    "Half a month of consistency. That's real growth! 🌱",
  ],
  month: [
    "A full month! You're absolutely crushing it. 🔥",
    "30 days of dedication. You inspire us! ✨",
    "This habit is now part of your identity. Own it! 👑",
  ],
  legend: [
    "100+ days?! You're a legend. Truly remarkable. 👑",
    "Your dedication is extraordinary. Keep shining! 🌟",
    "You've mastered consistency. What a journey! 💜",
  ],
};

const getMessageCategory = (streak: number): string => {
  if (streak >= 100) return "legend";
  if (streak >= 30) return "month";
  if (streak >= 14) return "twoWeeks";
  if (streak >= 7) return "week";
  if (streak >= 3) return "building";
  if (streak >= 1) return "starting";
  return "zero";
};

const getRandomMessage = (category: string): string => {
  const messages = motivationalMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

interface StreakWidgetProps {
  showMessage?: boolean;
}

const StreakWidget = ({ showMessage = false }: StreakWidgetProps) => {
  const { streakData, loading } = useStreakTracking();
  const [expanded, setExpanded] = useState(false);

  if (loading || !streakData) {
    return null;
  }

  const category = getMessageCategory(streakData.currentStreak);
  const message = getRandomMessage(category);

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return "👑";
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "⭐";
    if (streak >= 7) return "⚡";
    if (streak >= 3) return "💪";
    return "🌱";
  };

  if (showMessage) {
    return (
      <motion.div
        className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-4 border border-accent/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {streakData.currentStreak >= 7 ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="w-6 h-6 text-orange-500" />
              </motion.div>
            ) : (
              <span className="text-2xl">{getStreakEmoji(streakData.currentStreak)}</span>
            )}
            <div>
              <p className="font-heading font-bold text-foreground">
                {streakData.currentStreak} day streak
              </p>
              <p className="text-xs text-muted-foreground">
                Best: {streakData.longestStreak} days
              </p>
            </div>
          </div>
        </div>
        <motion.p
          className="text-sm text-foreground/80 mt-3 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 rounded-full cursor-pointer"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setExpanded(!expanded)}
      >
        {streakData.currentStreak >= 7 ? (
          <Flame className="w-4 h-4 text-orange-500" />
        ) : (
          <span className="text-sm">{getStreakEmoji(streakData.currentStreak)}</span>
        )}
        <span className="text-sm font-semibold text-foreground">
          {streakData.currentStreak}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-72 bg-card rounded-xl shadow-luna border border-border p-4 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            <div className="flex items-center gap-3 mb-3">
              {streakData.currentStreak >= 7 ? (
                <Flame className="w-5 h-5 text-orange-500" />
              ) : (
                <span className="text-xl">{getStreakEmoji(streakData.currentStreak)}</span>
              )}
              <div>
                <p className="font-heading font-bold text-foreground">
                  {streakData.currentStreak} day streak
                </p>
                <p className="text-xs text-muted-foreground">
                  Best: {streakData.longestStreak} days
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakWidget;

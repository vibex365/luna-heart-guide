import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Brain, Smile, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeeklyInsights } from "@/hooks/useWeeklyInsights";
import { useNotifications } from "@/hooks/useNotifications";

const WeeklyInsights = () => {
  const { insights, loading, sendInsightsNotification } = useWeeklyInsights();
  const { permission, requestPermission, isSupported } = useNotifications();

  const handleTestNotification = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    sendInsightsNotification();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground text-center">
          Weekly Insights
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground text-center">
          Weekly Insights
        </h3>
        <p className="text-muted-foreground text-center text-sm">
          No data available yet. Keep using Luna to build your insights!
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!insights.moodTrend) return <Minus className="w-5 h-5 text-muted-foreground" />;
    if (insights.moodTrend === "great") return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (insights.moodTrend === "balanced") return <Minus className="w-5 h-5 text-amber-500" />;
    return <TrendingDown className="w-5 h-5 text-rose-500" />;
  };

  const getTrendColor = () => {
    if (!insights.moodTrend) return "text-muted-foreground";
    if (insights.moodTrend === "great") return "text-green-500";
    if (insights.moodTrend === "balanced") return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground text-center">
        Weekly Insights
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Mood Card */}
        <motion.div
          className="bg-secondary/50 rounded-2xl p-4 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Mood</span>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`font-heading text-xl font-bold ${getTrendColor()}`}>
              {insights.avgMood !== null ? insights.avgMood.toFixed(1) : "-"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.moodCount} check-ins this week
          </p>
        </motion.div>

        {/* Conversations Card */}
        <motion.div
          className="bg-secondary/50 rounded-2xl p-4 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Focus</span>
          </div>
          <p className="font-heading text-sm font-semibold text-foreground line-clamp-1">
            {insights.topModule || "No data"}
          </p>
          <p className="text-xs text-muted-foreground">
            {insights.totalConversations} conversations
          </p>
        </motion.div>
      </div>

      {/* Notification Test */}
      {isSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleTestNotification}
          >
            <Bell className="w-4 h-4 mr-2" />
            Preview Weekly Notification
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Weekly insights are sent every Sunday at your reminder time
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default WeeklyInsights;

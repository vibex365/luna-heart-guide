import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Brain, Smile, Bell, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useWeeklyInsights } from "@/hooks/useWeeklyInsights";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface WeeklyInsightsProps {
  weeklyInsightsEnabled?: boolean;
  onUpdate?: (enabled: boolean) => void;
}

const WeeklyInsights = ({ weeklyInsightsEnabled = true, onUpdate }: WeeklyInsightsProps) => {
  const { user } = useAuth();
  const { hasFeature, isPro, isLoading: subLoading } = useSubscription();
  const hasPersonalizedInsights = hasFeature("personalized_insights") || isPro;
  const { insights, loading, sendInsightsNotification } = useWeeklyInsights();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [enabled, setEnabled] = useState(weeklyInsightsEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(weeklyInsightsEnabled);
  }, [weeklyInsightsEnabled]);

  const handleToggle = async (newEnabled: boolean) => {
    if (newEnabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Please enable notifications in your browser settings");
        return;
      }
    }

    setEnabled(newEnabled);
    await saveSettings(newEnabled);
  };

  const saveSettings = async (newEnabled: boolean) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ weekly_insights_enabled: newEnabled })
        .eq("user_id", user.id);

      if (error) throw error;

      onUpdate?.(newEnabled);
      toast.success(newEnabled ? "Weekly insights enabled" : "Weekly insights disabled");
    } catch (error) {
      console.error("Error saving weekly insights settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    sendInsightsNotification();
  };

  if (loading || subLoading) {
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

  // Show upgrade prompt for free users
  if (!hasPersonalizedInsights) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground text-center flex items-center justify-center gap-2">
          Weekly Insights
          <Lock className="w-4 h-4 text-muted-foreground" />
        </h3>
        <div className="bg-secondary/50 rounded-2xl p-6 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Get personalized weekly insights about your mood patterns and conversation topics.
          </p>
          <Link to="/subscription">
            <Button variant="outline" size="sm" className="border-primary text-primary">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!insights?.moodTrend) return <Minus className="w-5 h-5 text-muted-foreground" />;
    if (insights.moodTrend === "great") return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (insights.moodTrend === "balanced") return <Minus className="w-5 h-5 text-amber-500" />;
    return <TrendingDown className="w-5 h-5 text-rose-500" />;
  };

  const getTrendColor = () => {
    if (!insights?.moodTrend) return "text-muted-foreground";
    if (insights.moodTrend === "great") return "text-green-500";
    if (insights.moodTrend === "balanced") return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground text-center">
        Weekly Insights
      </h3>

      {/* Weekly Notifications Toggle */}
      {isSupported && (
        <motion.div
          className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <div className="space-y-0.5">
              <Label htmlFor="weekly-toggle" className="text-foreground text-sm font-medium">
                Weekly summary notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get insights every Sunday
              </p>
            </div>
          </div>
          <Switch
            id="weekly-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </motion.div>
      )}

      {insights && (
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
      )}

      {!insights && (
        <p className="text-muted-foreground text-center text-sm">
          No data available yet. Keep using Luna to build your insights!
        </p>
      )}

      {/* Notification Preview */}
      {isSupported && enabled && (
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
        </motion.div>
      )}
    </div>
  );
};

export default WeeklyInsights;

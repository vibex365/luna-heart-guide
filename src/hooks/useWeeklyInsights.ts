import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";

interface MoodEntry {
  mood_level: number;
  mood_label: string;
  created_at: string;
}

interface AnalyticsEntry {
  module_activated: string;
  created_at: string;
}

interface WeeklyInsights {
  avgMood: number | null;
  moodTrend: "great" | "balanced" | "challenging" | null;
  moodCount: number;
  topModule: string | null;
  topModuleCount: number;
  totalConversations: number;
}

const moduleLabels: Record<string, string> = {
  communication_coaching: "Communication Skills",
  conflict_deescalation: "Conflict Resolution",
  emotional_mirror: "Emotional Processing",
  pattern_spotting: "Pattern Recognition",
  boundary_building: "Boundary Setting",
  breakup_healing: "Healing & Recovery",
  self_worth: "Self-Worth Building",
  general_support: "General Support",
};

export function useWeeklyInsights() {
  const { user } = useAuth();
  const { permission, showNotification } = useNotifications();
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;

    setLoading(true);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    try {
      // Get mood entries
      const { data: moodEntries } = await supabase
        .from("mood_entries")
        .select("mood_level, mood_label, created_at")
        .eq("user_id", user.id)
        .gte("created_at", oneWeekAgoISO)
        .order("created_at", { ascending: false });

      // Get conversation analytics
      const { data: analyticsEntries } = await supabase
        .from("conversation_analytics")
        .select("module_activated, created_at")
        .eq("user_id", user.id)
        .gte("created_at", oneWeekAgoISO);

      // Calculate mood insights
      let avgMood: number | null = null;
      let moodTrend: "great" | "balanced" | "challenging" | null = null;

      if (moodEntries && moodEntries.length > 0) {
        avgMood = moodEntries.reduce((sum, e) => sum + e.mood_level, 0) / moodEntries.length;
        moodTrend = avgMood >= 7 ? "great" : avgMood >= 5 ? "balanced" : "challenging";
      }

      // Calculate top module
      let topModule: string | null = null;
      let topModuleCount = 0;

      if (analyticsEntries && analyticsEntries.length > 0) {
        const moduleCounts: Record<string, number> = {};
        analyticsEntries.forEach((e) => {
          moduleCounts[e.module_activated] = (moduleCounts[e.module_activated] || 0) + 1;
        });

        const sorted = Object.entries(moduleCounts).sort(([, a], [, b]) => b - a);
        if (sorted.length > 0) {
          topModule = moduleLabels[sorted[0][0]] || sorted[0][0];
          topModuleCount = sorted[0][1];
        }
      }

      setInsights({
        avgMood,
        moodTrend,
        moodCount: moodEntries?.length || 0,
        topModule,
        topModuleCount,
        totalConversations: analyticsEntries?.length || 0,
      });
    } catch (error) {
      console.error("Error loading weekly insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendInsightsNotification = () => {
    if (permission !== "granted" || !insights) return;

    let body = "";
    if (insights.avgMood !== null) {
      body += `Your mood has been ${insights.moodTrend} this week (avg: ${insights.avgMood.toFixed(1)}/10). `;
    }
    if (insights.topModule) {
      body += `You focused most on ${insights.topModule} (${insights.topModuleCount} conversations).`;
    }
    if (!body) {
      body = "Keep checking in with Luna to build your insights!";
    }

    showNotification("Your Weekly Luna Insights 💜", {
      body,
      icon: "/favicon.ico",
      tag: "weekly-insights",
    });
  };

  return {
    insights,
    loading,
    sendInsightsNotification,
    moduleLabels,
  };
}

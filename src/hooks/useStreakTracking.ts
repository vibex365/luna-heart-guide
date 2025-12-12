import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Date | null;
  totalCheckIns: number;
}

export function useStreakTracking() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user]);

  const loadStreakData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data: moodEntries, error } = await supabase
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!moodEntries || moodEntries.length === 0) {
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          lastCheckIn: null,
          totalCheckIns: 0,
        });
        setLoading(false);
        return;
      }

      // Get unique dates (one entry per day counts)
      const uniqueDates = new Set<string>();
      moodEntries.forEach((entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        uniqueDates.add(date);
      });

      const sortedDates = Array.from(uniqueDates)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if the most recent entry is today or yesterday
      const mostRecent = sortedDates[0];
      mostRecent.setHours(0, 0, 0, 0);

      if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
        currentStreak = 1;
        let checkDate = new Date(mostRecent);
        
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(checkDate);
          prevDate.setDate(prevDate.getDate() - 1);
          
          const entryDate = sortedDates[i];
          entryDate.setHours(0, 0, 0, 0);
          
          if (entryDate.getTime() === prevDate.getTime()) {
            currentStreak++;
            checkDate = entryDate;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = sortedDates[i];
        const next = sortedDates[i + 1];
        
        const diffTime = current.getTime() - next.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      setStreakData({
        currentStreak,
        longestStreak,
        lastCheckIn: new Date(moodEntries[0].created_at),
        totalCheckIns: moodEntries.length,
      });
    } catch (error) {
      console.error("Error loading streak data:", error);
    } finally {
      setLoading(false);
    }
  };

  return { streakData, loading, refresh: loadStreakData };
}

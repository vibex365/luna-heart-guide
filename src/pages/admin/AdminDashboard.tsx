import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { MoodDistributionChart } from "@/components/admin/MoodDistributionChart";
import { RecentActivityCard } from "@/components/admin/RecentActivityCard";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  UserPlus,
  Activity
} from "lucide-react";

const AdminDashboard = () => {
  // Fetch total users
  const { data: userCount = 0 } = useQuery({
    queryKey: ["admin-user-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch total conversations
  const { data: conversationCount = 0 } = useQuery({
    queryKey: ["admin-conversation-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch total messages
  const { data: messageCount = 0 } = useQuery({
    queryKey: ["admin-message-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch mood entries for distribution
  const { data: moodData = [] } = useQuery({
    queryKey: ["admin-mood-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("mood_label");
      if (error) throw error;
      
      // Count mood occurrences
      const moodCounts: Record<string, number> = {};
      data?.forEach((entry) => {
        moodCounts[entry.mood_label] = (moodCounts[entry.mood_label] || 0) + 1;
      });

      const moodColors: Record<string, string> = {
        "Happy": "#10B981",
        "Calm": "#6366F1",
        "Sad": "#3B82F6",
        "Anxious": "#F59E0B",
        "Angry": "#EF4444",
        "Neutral": "#8B5CF6",
      };

      return Object.entries(moodCounts).map(([name, value]) => ({
        name,
        value,
        color: moodColors[name] || "#8D6E8A",
      }));
    },
  });

  // Fetch recent signups
  const { data: recentSignups = 0 } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const activities: Array<{
        id: string;
        type: "message" | "mood" | "journal" | "signup";
        description: string;
        timestamp: string;
      }> = [];

      // Get recent messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id, created_at, role")
        .order("created_at", { ascending: false })
        .limit(3);

      messages?.forEach((msg) => {
        activities.push({
          id: `msg-${msg.id}`,
          type: "message",
          description: `New ${msg.role} message`,
          timestamp: msg.created_at,
        });
      });

      // Get recent mood entries
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("id, created_at, mood_label")
        .order("created_at", { ascending: false })
        .limit(3);

      moods?.forEach((mood) => {
        activities.push({
          id: `mood-${mood.id}`,
          type: "mood",
          description: `Mood logged: ${mood.mood_label}`,
          timestamp: mood.created_at,
        });
      });

      // Sort by timestamp
      return activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5);
    },
  });

  // Calculate average messages per conversation
  const avgMessagesPerConversation = conversationCount > 0 
    ? Math.round(messageCount / conversationCount) 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your Luna platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={userCount}
            icon={Users}
            trend={{ value: 12, label: "vs last week" }}
          />
          <StatCard
            title="Active Conversations"
            value={conversationCount}
            icon={MessageSquare}
            trend={{ value: 8, label: "vs last week" }}
          />
          <StatCard
            title="Mood Entries"
            value={moodData.reduce((sum, m) => sum + m.value, 0)}
            icon={Heart}
            trend={{ value: 15, label: "vs last week" }}
          />
          <StatCard
            title="Daily Signups"
            value={recentSignups}
            icon={UserPlus}
            subtitle="Last 24 hours"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Avg Messages/Conversation"
            value={avgMessagesPerConversation}
            icon={Activity}
          />
          <StatCard
            title="Total Messages"
            value={messageCount}
            icon={MessageSquare}
          />
          <StatCard
            title="User Retention"
            value="78%"
            icon={TrendingUp}
            trend={{ value: 3, label: "vs last month" }}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoodDistributionChart data={moodData} />
          <RecentActivityCard activities={recentActivity} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

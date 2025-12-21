import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { MoodDistributionChart } from "@/components/admin/MoodDistributionChart";
import { RecentActivityCard } from "@/components/admin/RecentActivityCard";
import { AdminActionLog } from "@/components/admin/AdminActionLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  UserPlus,
  Activity,
  DollarSign,
  Zap,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { format } from "date-fns";

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

      return activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5);
    },
  });

  const avgMessagesPerConversation = conversationCount > 0 
    ? Math.round(messageCount / conversationCount) 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with Luna today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: {format(new Date(), "MMM d, h:mm a")}</span>
          </div>
        </div>

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title="Total Users"
              value={userCount.toLocaleString()}
              icon={Users}
              trend={{ value: 12, label: "vs last week" }}
              variant="accent"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <StatCard
              title="Active Conversations"
              value={conversationCount.toLocaleString()}
              icon={MessageSquare}
              trend={{ value: 8, label: "vs last week" }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Mood Entries"
              value={moodData.reduce((sum, m) => sum + m.value, 0).toLocaleString()}
              icon={Heart}
              trend={{ value: 15, label: "vs last week" }}
              variant="success"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <StatCard
              title="New Signups (24h)"
              value={recentSignups}
              icon={UserPlus}
              subtitle="Last 24 hours"
              variant="warning"
            />
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-accent/5 via-primary/5 to-peach/5 border-accent/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{avgMessagesPerConversation}</p>
                  <p className="text-sm text-muted-foreground mt-1">Avg Messages/Convo</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{messageCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Messages</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-3xl font-bold text-foreground">78%</p>
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">User Retention</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-3xl font-bold text-foreground">4.8</p>
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Avg. Session (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <MoodDistributionChart data={moodData} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RecentActivityCard activities={recentActivity} />
          </motion.div>
        </div>

        {/* Admin Action Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <AdminActionLog />
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageAnalytics } from "@/components/admin/UsageAnalytics";
import GeoVisualization from "@/components/admin/GeoVisualization";
import { 
  BarChart3, 
  Brain, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Users,
  Calendar,
  Activity,
  Globe
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export default function AdminAnalytics() {
  // Fetch mood entries for trends
  const { data: moodData, isLoading: moodLoading } = useQuery({
    queryKey: ["admin-mood-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("mood_entries")
        .select("mood_level, mood_label, created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch conversation analytics
  const { data: conversationAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-conversation-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("conversation_analytics")
        .select("module_activated, trigger_detected, created_at")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  // Fetch conversations count
  const { data: conversationsData } = useQuery({
    queryKey: ["admin-conversations-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch journal entries count
  const { data: journalCount } = useQuery({
    queryKey: ["admin-journal-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch user count
  const { data: userCount } = useQuery({
    queryKey: ["admin-user-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Process mood data for charts
  const processMoodTrends = () => {
    if (!moodData) return [];
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return last14Days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEntries = moodData.filter((entry) => {
        const entryDate = startOfDay(new Date(entry.created_at));
        return entryDate.getTime() === dayStart.getTime();
      });

      const avgMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + e.mood_level, 0) / dayEntries.length
        : null;

      return {
        date: format(day, "MMM d"),
        avgMood: avgMood ? Number(avgMood.toFixed(1)) : null,
        entries: dayEntries.length,
      };
    });
  };

  const processMoodDistribution = () => {
    if (!moodData) return [];
    
    const distribution: Record<string, number> = {};
    moodData.forEach((entry) => {
      distribution[entry.mood_label] = (distribution[entry.mood_label] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const processModuleUsage = () => {
    if (!conversationAnalytics) return [];
    
    const modules: Record<string, number> = {};
    conversationAnalytics.forEach((entry) => {
      const module = entry.module_activated || "unknown";
      modules[module] = (modules[module] || 0) + 1;
    });

    return Object.entries(modules)
      .map(([name, count]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const moodTrends = processMoodTrends();
  const moodDistribution = processMoodDistribution();
  const moduleUsage = processModuleUsage();

  const MOOD_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const isLoading = moodLoading || analyticsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track emotional trends, platform usage, and subscription metrics
            </p>
          </div>
        </div>

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usage">Usage & Subscriptions</TabsTrigger>
            <TabsTrigger value="mood">Mood Analytics</TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Visitor Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            <UsageAnalytics />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            <GeoVisualization />
          </TabsContent>

          <TabsContent value="mood" className="space-y-6">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{userCount || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{conversationsData || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mood Entries (30d)</p>
                  <p className="text-2xl font-bold">{moodData?.length || 0}</p>
                </div>
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Journal Entries</p>
                  <p className="text-2xl font-bold">{journalCount || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mood Trends (14 Days)
              </CardTitle>
              <CardDescription>
                Average mood level and entry count per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={moodTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgMood"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                      name="Avg Mood"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No mood data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Mood Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of mood types over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {moodDistribution.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={MOOD_COLORS[index % MOOD_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No mood data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Luna Module Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Luna Module Usage
              </CardTitle>
              <CardDescription>
                Most activated conversation modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moduleUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={moduleUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--accent))" 
                      radius={[0, 4, 4, 0]}
                      name="Activations"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No module usage data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daily Engagement
              </CardTitle>
              <CardDescription>
                Number of mood entries logged per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={moodTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="entries" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Entries"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Average Mood (30 Days)
                </p>
                <p className="text-3xl font-bold">
                  {moodData && moodData.length > 0
                    ? (moodData.reduce((sum, e) => sum + e.mood_level, 0) / moodData.length).toFixed(1)
                    : "N/A"
                  }
                  <span className="text-lg text-muted-foreground">/5</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Most Common Mood
                </p>
                <p className="text-3xl font-bold capitalize">
                  {moodDistribution.length > 0
                    ? moodDistribution.sort((a, b) => b.value - a.value)[0]?.name || "N/A"
                    : "N/A"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Top Luna Module
                </p>
                <p className="text-3xl font-bold">
                  {moduleUsage.length > 0
                    ? moduleUsage[0]?.name || "N/A"
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

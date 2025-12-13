import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay, startOfWeek, eachWeekOfInterval } from "date-fns";
import { MessageSquare, TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const UsageAnalytics = () => {
  // Fetch daily message volumes
  const { data: messageData } = useQuery({
    queryKey: ["admin-message-volumes"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("messages")
        .select("created_at, role")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscription data for conversion rates
  const { data: subscriptionData } = useQuery({
    queryKey: ["admin-subscription-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          tier_id,
          status,
          created_at,
          subscription_tiers (
            name,
            slug,
            price_monthly
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  // Fetch total user count
  const { data: userCount } = useQuery({
    queryKey: ["admin-total-users"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Process daily message volumes
  const processDailyMessages = () => {
    if (!messageData) return [];
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return last14Days.map((day) => {
      const dayStart = startOfDay(day);
      const dayMessages = messageData.filter((msg) => {
        const msgDate = startOfDay(new Date(msg.created_at));
        return msgDate.getTime() === dayStart.getTime();
      });

      const userMessages = dayMessages.filter(m => m.role === "user").length;
      const assistantMessages = dayMessages.filter(m => m.role === "assistant").length;

      return {
        date: format(day, "MMM d"),
        userMessages,
        assistantMessages,
        total: dayMessages.length,
      };
    });
  };

  // Process weekly message volumes
  const processWeeklyMessages = () => {
    if (!messageData) return [];
    
    const weeks = eachWeekOfInterval({
      start: subDays(new Date(), 56),
      end: new Date(),
    });

    return weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekMessages = messageData.filter((msg) => {
        const msgDate = new Date(msg.created_at);
        return msgDate >= weekStart && msgDate < weekEnd;
      });

      return {
        week: format(weekStart, "MMM d"),
        messages: weekMessages.length,
      };
    }).slice(-8);
  };

  // Calculate subscription conversion metrics
  const calculateConversionMetrics = () => {
    if (!subscriptionData || !userCount) {
      return { freeUsers: 0, paidUsers: 0, conversionRate: 0, proUsers: 0, couplesUsers: 0 };
    }

    const activeSubscriptions = subscriptionData.filter(s => s.status === "active");
    
    const paidUsers = activeSubscriptions.filter(s => {
      const tier = s.subscription_tiers as any;
      return tier?.price_monthly > 0;
    }).length;

    const proUsers = activeSubscriptions.filter(s => {
      const tier = s.subscription_tiers as any;
      return tier?.slug === "pro";
    }).length;

    const couplesUsers = activeSubscriptions.filter(s => {
      const tier = s.subscription_tiers as any;
      return tier?.slug === "couples";
    }).length;

    const freeUsers = userCount - paidUsers;
    const conversionRate = userCount > 0 ? (paidUsers / userCount) * 100 : 0;

    return { freeUsers, paidUsers, conversionRate, proUsers, couplesUsers };
  };

  // Calculate message growth
  const calculateMessageGrowth = () => {
    if (!messageData) return { growth: 0, trend: "neutral" };
    
    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);
    
    const thisWeekMessages = messageData.filter(m => new Date(m.created_at) >= thisWeekStart).length;
    const lastWeekMessages = messageData.filter(m => {
      const date = new Date(m.created_at);
      return date >= lastWeekStart && date < thisWeekStart;
    }).length;

    if (lastWeekMessages === 0) return { growth: 100, trend: "up" };
    
    const growth = ((thisWeekMessages - lastWeekMessages) / lastWeekMessages) * 100;
    return { 
      growth: Math.abs(growth).toFixed(1), 
      trend: growth >= 0 ? "up" : "down" 
    };
  };

  const dailyMessages = processDailyMessages();
  const weeklyMessages = processWeeklyMessages();
  const conversionMetrics = calculateConversionMetrics();
  const messageGrowth = calculateMessageGrowth();

  const totalMessagesToday = dailyMessages[dailyMessages.length - 1]?.total || 0;
  const avgDailyMessages = dailyMessages.reduce((sum, d) => sum + d.total, 0) / dailyMessages.length || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Messages</p>
                <p className="text-2xl font-bold">{totalMessagesToday}</p>
                <div className="flex items-center gap-1 mt-1">
                  {messageGrowth.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs ${messageGrowth.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {messageGrowth.growth}% vs last week
                  </span>
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Messages</p>
                <p className="text-2xl font-bold">{avgDailyMessages.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 14 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionMetrics.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Free to paid</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Subscribers</p>
                <p className="text-2xl font-bold">{conversionMetrics.paidUsers}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">Pro: {conversionMetrics.proUsers}</Badge>
                  <Badge variant="secondary" className="text-xs">Couples: {conversionMetrics.couplesUsers}</Badge>
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Message Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Daily Message Volume
            </CardTitle>
            <CardDescription>
              User and assistant messages per day (14 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyMessages.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyMessages}>
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="userMessages"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.6)"
                    name="User"
                  />
                  <Area
                    type="monotone"
                    dataKey="assistantMessages"
                    stackId="1"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent) / 0.6)"
                    name="Assistant"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No message data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Message Trends
            </CardTitle>
            <CardDescription>
              Total messages per week (8 weeks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyMessages.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyMessages}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
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
                    dataKey="messages" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Messages"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No weekly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Funnel</CardTitle>
          <CardDescription>User distribution across subscription tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold">{userCount || 0}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-3xl font-bold">{conversionMetrics.freeUsers}</p>
              <p className="text-sm text-muted-foreground">Free Tier</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-3xl font-bold text-primary">{conversionMetrics.proUsers}</p>
              <p className="text-sm text-muted-foreground">Pro Tier</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 text-center">
              <p className="text-3xl font-bold text-accent">{conversionMetrics.couplesUsers}</p>
              <p className="text-sm text-muted-foreground">Couples Tier</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

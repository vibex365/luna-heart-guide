import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Users
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export const SmsAnalytics = () => {
  // Fetch delivery stats
  const { data: deliveryStats } = useQuery({
    queryKey: ["sms-delivery-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_delivery_logs")
        .select("status");
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        delivered: data?.filter(d => d.status === "delivered").length || 0,
        failed: data?.filter(d => d.status === "failed").length || 0,
        pending: data?.filter(d => d.status === "pending").length || 0,
      };
      
      return stats;
    },
  });

  // Fetch daily usage trends (last 7 days)
  const { data: dailyTrends } = useQuery({
    queryKey: ["sms-daily-trends"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const { data, error } = await supabase
          .from("sms_delivery_logs")
          .select("id, status")
          .gte("sent_at", startOfDay(date).toISOString())
          .lt("sent_at", endOfDay(date).toISOString());
        
        if (!error) {
          days.push({
            date: format(date, "EEE"),
            total: data?.length || 0,
            delivered: data?.filter(d => d.status === "delivered").length || 0,
            failed: data?.filter(d => d.status === "failed").length || 0,
          });
        }
      }
      return days;
    },
  });

  // Fetch popular templates
  const { data: popularTemplates } = useQuery({
    queryKey: ["sms-popular-templates"],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from("sms_delivery_logs")
        .select("message");
      
      if (logsError) throw logsError;

      const { data: templates, error: templatesError } = await supabase
        .from("sms_templates")
        .select("id, name, message");
      
      if (templatesError) throw templatesError;

      // Count template usage by matching messages
      const templateUsage = templates?.map(template => {
        const count = logs?.filter(log => log.message === template.message).length || 0;
        return { name: template.name, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5) || [];

      return templateUsage;
    },
  });

  const deliveryRate = deliveryStats?.total 
    ? Math.round((deliveryStats.delivered / deliveryStats.total) * 100) 
    : 0;

  const pieData = [
    { name: "Delivered", value: deliveryStats?.delivered || 0, color: "hsl(var(--chart-1))" },
    { name: "Failed", value: deliveryStats?.failed || 0, color: "hsl(var(--destructive))" },
    { name: "Pending", value: deliveryStats?.pending || 0, color: "hsl(var(--muted))" },
  ].filter(d => d.value > 0);

  const chartConfig = {
    total: { label: "Total", color: "hsl(var(--chart-1))" },
    delivered: { label: "Delivered", color: "hsl(var(--chart-2))" },
    failed: { label: "Failed", color: "hsl(var(--destructive))" },
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-accent" />
        <div>
          <h2 className="text-lg md:text-xl font-bold">SMS Analytics</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Delivery rates, usage trends, and template performance
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-accent/10">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sent</p>
                <p className="text-lg md:text-2xl font-bold">{deliveryStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-lg md:text-2xl font-bold">{deliveryStats?.delivered || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg md:text-2xl font-bold">{deliveryStats?.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivery Rate</p>
                <p className="text-lg md:text-2xl font-bold">{deliveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Delivery Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Delivery Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Overall delivery breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }} 
                  />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trends Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Usage Trends</CardTitle>
            <CardDescription className="text-xs md:text-sm">Messages sent in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTrends && dailyTrends.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-48 md:h-64 w-full">
                <BarChart data={dailyTrends}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="delivered" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText className="h-4 w-4 md:h-5 md:w-5" />
            Popular Templates
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Most frequently used SMS templates</CardDescription>
        </CardHeader>
        <CardContent>
          {popularTemplates && popularTemplates.length > 0 ? (
            <div className="space-y-3">
              {popularTemplates.map((template, index) => (
                <div key={template.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    <span className="text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-none">
                      {template.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{template.count} uses</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No templates used yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

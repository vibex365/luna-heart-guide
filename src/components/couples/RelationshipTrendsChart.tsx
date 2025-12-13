import { motion } from "framer-motion";
import { TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { format, parseISO } from "date-fns";

const chartConfig = {
  communication: {
    label: "Communication",
    color: "hsl(217, 91%, 60%)",
  },
  trust: {
    label: "Trust",
    color: "hsl(142, 76%, 36%)",
  },
  intimacy: {
    label: "Intimacy",
    color: "hsl(330, 81%, 60%)",
  },
  conflict: {
    label: "Conflict Resolution",
    color: "hsl(270, 76%, 60%)",
  },
};

export const RelationshipTrendsChart = () => {
  const { partnerLink } = useCouplesAccount();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessment-history", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];

      const { data, error } = await supabase
        .from("relationship_assessments")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .order("assessment_date", { ascending: true })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!partnerLink,
  });

  // Aggregate assessments by date (average both partners' scores)
  const chartData = assessments.reduce((acc, assessment) => {
    const dateKey = assessment.assessment_date;
    const existing = acc.find(d => d.date === dateKey);

    if (existing) {
      // Average with existing entry (partner's score)
      existing.communication = Math.round((existing.communication + assessment.communication_score) / 2);
      existing.trust = Math.round((existing.trust + assessment.trust_score) / 2);
      existing.intimacy = Math.round((existing.intimacy + assessment.intimacy_score) / 2);
      existing.conflict = Math.round((existing.conflict + assessment.conflict_score) / 2);
    } else {
      acc.push({
        date: dateKey,
        dateLabel: format(parseISO(dateKey), "MMM d"),
        communication: assessment.communication_score,
        trust: assessment.trust_score,
        intimacy: assessment.intimacy_score,
        conflict: assessment.conflict_score,
      });
    }

    return acc;
  }, [] as Array<{
    date: string;
    dateLabel: string;
    communication: number;
    trust: number;
    intimacy: number;
    conflict: number;
  }>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-[200px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Complete assessments over time to see your relationship trends
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Relationship Trends
        </CardTitle>
        <CardDescription>How your scores have changed over time</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[250px] w-full"
        >
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="communication"
                stroke={chartConfig.communication.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="trust"
                stroke={chartConfig.trust.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="intimacy"
                stroke={chartConfig.intimacy.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="conflict"
                stroke={chartConfig.conflict.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

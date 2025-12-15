import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";

const chartConfig = {
  myScore: {
    label: "Your Score",
    color: "hsl(217, 91%, 60%)",
  },
  partnerScore: {
    label: "Partner's Score",
    color: "hsl(330, 81%, 60%)",
  },
  average: {
    label: "Average",
    color: "hsl(142, 76%, 36%)",
  },
};

type Category = "communication" | "trust" | "intimacy" | "conflict";

const categoryLabels: Record<Category, string> = {
  communication: "Communication",
  trust: "Trust",
  intimacy: "Intimacy",
  conflict: "Conflict Resolution",
};

export const RelationshipTrendsChart = () => {
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const [selectedCategory, setSelectedCategory] = useState<Category>("communication");

  const partnerId = partnerLink?.user_id === user?.id ? partnerLink?.partner_id : partnerLink?.user_id;

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessment-history", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink) return [];

      const { data, error } = await supabase
        .from("relationship_assessments")
        .select("*")
        .eq("partner_link_id", partnerLink.id)
        .order("assessment_date", { ascending: true })
        .limit(60);

      if (error) throw error;
      return data;
    },
    enabled: !!partnerLink,
  });

  // Build chart data with separate lines for user and partner
  const chartData = assessments.reduce((acc, assessment) => {
    const dateKey = assessment.assessment_date;
    let existing = acc.find(d => d.date === dateKey);

    if (!existing) {
      existing = {
        date: dateKey,
        dateLabel: format(parseISO(dateKey), "MMM d"),
        myScore: null as number | null,
        partnerScore: null as number | null,
        average: null as number | null,
      };
      acc.push(existing);
    }

    const score = assessment[`${selectedCategory}_score` as keyof typeof assessment] as number;
    
    if (assessment.user_id === user?.id) {
      existing.myScore = score;
    } else if (assessment.user_id === partnerId) {
      existing.partnerScore = score;
    }

    // Calculate average if both scores exist
    if (existing.myScore !== null && existing.partnerScore !== null) {
      existing.average = Math.round((existing.myScore + existing.partnerScore) / 2);
    }

    return acc;
  }, [] as Array<{
    date: string;
    dateLabel: string;
    myScore: number | null;
    partnerScore: number | null;
    average: number | null;
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

  // Check if we have both partners' data
  const hasBothPartners = chartData.some(d => d.myScore !== null && d.partnerScore !== null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Assessment History
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          {hasBothPartners && <Users className="w-3 h-3" />}
          {hasBothPartners ? "Compare your scores with your partner over time" : "Your scores over time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category selector */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="text-xs"
            >
              {categoryLabels[cat]}
            </Button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={selectedCategory}
          className="h-[250px] w-full"
        >
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              <Line
                type="monotone"
                dataKey="myScore"
                name="You"
                stroke={chartConfig.myScore.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              
              {hasBothPartners && (
                <>
                  <Line
                    type="monotone"
                    dataKey="partnerScore"
                    name="Partner"
                    stroke={chartConfig.partnerScore.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Average"
                    stroke={chartConfig.average.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ChartContainer>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: chartConfig.myScore.color }}
            />
            <span className="text-xs text-muted-foreground">You</span>
          </div>
          {hasBothPartners && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chartConfig.partnerScore.color }}
                />
                <span className="text-xs text-muted-foreground">Partner</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2 border-dashed"
                  style={{ borderColor: chartConfig.average.color }}
                />
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
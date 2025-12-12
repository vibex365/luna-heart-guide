import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";

interface MoodEntry {
  id: string;
  mood_level: number;
  mood_label: string;
  created_at: string;
}

interface MoodChartProps {
  entries: MoodEntry[];
}

const MoodChart = ({ entries }: MoodChartProps) => {
  const chartData = useMemo(() => {
    // Get last 14 days
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      return format(date, "yyyy-MM-dd");
    });

    // Map entries to dates
    const entryMap = new Map<string, number>();
    entries.forEach((entry) => {
      const date = format(parseISO(entry.created_at), "yyyy-MM-dd");
      if (!entryMap.has(date) || entry.mood_level > entryMap.get(date)!) {
        entryMap.set(date, entry.mood_level);
      }
    });

    return days.map((date) => ({
      date,
      displayDate: format(parseISO(date), "MMM d"),
      mood: entryMap.get(date) ?? null,
    }));
  }, [entries]);

  const moodLabels: Record<number, string> = {
    1: "Very Low",
    2: "Low",
    3: "Neutral",
    4: "Good",
    5: "Great",
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-soft">
          <p className="text-sm font-medium text-foreground">{data.displayDate}</p>
          <p className="text-sm text-muted-foreground">
            {moodLabels[payload[0].value]} ({payload[0].value}/5)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(value) => ["😢", "😔", "😐", "🙂", "😊"][value - 1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--accent))" }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodChart;

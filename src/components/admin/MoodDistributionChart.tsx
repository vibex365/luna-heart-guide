import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MoodData {
  name: string;
  value: number;
  color: string;
}

interface MoodDistributionChartProps {
  data: MoodData[];
}

export const MoodDistributionChart = ({ data }: MoodDistributionChartProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Mood Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface ProgressData {
  date: string;
  workouts: number;
  streak: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  title: string;
  rangeLabel?: string;
  summary?: string;
}

export function ProgressChart({ data, title, rangeLabel, summary }: ProgressChartProps) {
  const resolvedRangeLabel = rangeLabel ?? (data.length > 0 ? `Last ${data.length} days` : "No data yet");
  const resolvedSummary = summary ?? `${data[data.length - 1]?.workouts ?? 0} workouts logged`;

  return (
    <Card data-testid="card-progress-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <Line 
                type="monotone" 
                dataKey="workouts" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <span>{resolvedRangeLabel}</span>
          <span>{resolvedSummary}</span>
        </div>
      </CardContent>
    </Card>
  );
}
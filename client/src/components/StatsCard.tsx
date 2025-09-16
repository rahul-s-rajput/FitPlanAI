import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card data-testid={`card-stats-${title.toLowerCase().replace(" ", "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold" data-testid={`text-stats-value-${title.toLowerCase().replace(" ", "-")}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {trend && (
              <div className="text-right">
                <span className={`text-xs font-medium ${
                  trend.value > 0 ? "text-chart-3" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                <p className="text-xs text-muted-foreground">{trend.label}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
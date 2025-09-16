import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Award, Flame, Gauge } from "lucide-react";
import { ProgressChart } from "@/components/ProgressChart";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutLogCard } from "@/components/WorkoutLogCard";
import { useQuery } from "@tanstack/react-query";
import type { Workout, WorkoutLog } from "@shared/schema";

type WorkoutLogWithWorkout = Omit<WorkoutLog, "completedAt"> & {
  completedAt: string | null;
  workout: (Workout & Record<string, unknown>) | null;
};

interface TagBreakdownItem {
  tag: string;
  count: number;
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  workouts: number;
  minutes: number;
  avgRpe: number;
  calories: number;
}

interface ProgressResponse {
  dailyStats: Array<{ date: string; workouts: number; streak: number }>;
  totalWorkouts: number;
  averageRating: number;
  currentStreak: number;
  workoutsThisWeek: number;
  totalMinutes: number;
  averageRpe: number;
  totalCalories: number;
  tagBreakdown: TagBreakdownItem[];
  weeklySummaries: WeeklySummary[];
  rangeDays: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function ProgressPage() {
  const progressQuery = useQuery<ProgressResponse>({
    queryKey: ["progress", 28],
    queryFn: () => fetchJson<ProgressResponse>("/api/progress?days=28"),
    staleTime: 60_000,
  });

  const logsQuery = useQuery<WorkoutLogWithWorkout[]>({
    queryKey: ["workout-logs", 5],
    queryFn: () => fetchJson<WorkoutLogWithWorkout[]>("/api/workout-logs?limit=5"),
    staleTime: 60_000,
  });

  const progress = progressQuery.data;
  const progressLoading = progressQuery.isLoading;
  const progressHasError = Boolean(progressQuery.error);

  const workoutLogs = logsQuery.data ?? [];
  const logsHasError = Boolean(logsQuery.error);
  const recentLogs = workoutLogs.map((log) => ({
    ...log,
    completedAt: log.completedAt ? new Date(log.completedAt) : null,
  }));

  const handleViewDetails = (logId: string) => {
    console.log("View workout log details:", logId);
  };

  const chartData = progress?.dailyStats ?? [];

  const getDisplayValue = (value: number | string) =>
    typeof value === "number" ? value.toLocaleString() : value;

  const currentStreakValue = progress
    ? progress.currentStreak
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : 0;
  const workoutsThisWeekValue = progress
    ? progress.workoutsThisWeek
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : 0;
  const totalMinutesRaw = progress
    ? progress.totalMinutes
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : 0;
  const totalMinutesValue = getDisplayValue(totalMinutesRaw);
  const totalCaloriesRaw = progress
    ? progress.totalCalories
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : 0;
  const totalCaloriesValue = getDisplayValue(totalCaloriesRaw);
  const averageRatingValue = progress
    ? progress.averageRating.toFixed(1)
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : "0.0";
  const averageRpeValue = progress
    ? progress.averageRpe.toFixed(1)
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : "0.0";

  const weeklySummaryRows = progress
    ? progress.weeklySummaries
        .slice()
        .reverse()
        .map((summary) => ({
          ...summary,
          weekStartDate: new Date(summary.weekStart),
          weekEndDate: new Date(summary.weekEnd),
        }))
    : [];
  const topTags = progress ? progress.tagBreakdown.slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatsCard
            title="Current Streak"
            value={currentStreakValue}
            subtitle="days"
            icon={Award}
          />
          <StatsCard
            title="This Week"
            value={workoutsThisWeekValue}
            subtitle="workouts"
            icon={Calendar}
          />
          <StatsCard
            title="Total Time"
            value={totalMinutesValue}
            subtitle="minutes logged"
            icon={Clock}
          />
          <StatsCard
            title="Avg Rating"
            value={averageRatingValue}
            subtitle="out of 5"
            icon={TrendingUp}
          />
          <StatsCard
            title="Avg RPE"
            value={averageRpeValue}
            subtitle="per session"
            icon={Gauge}
          />
          <StatsCard
            title="Calories"
            value={totalCaloriesValue}
            subtitle="burned"
            icon={Flame}
          />
        </div>

        {progressHasError ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-destructive">
              Unable to load progress overview. Please try again later.
            </CardContent>
          </Card>
        ) : (
          <ProgressChart
            data={chartData}
            title="Activity Trend"
            rangeLabel={progress ? `Last ${progress.rangeDays} days` : undefined}
            summary={progress ? `${progress.workoutsThisWeek} workouts this week` : undefined}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Calculating weekly insights…
              </div>
            ) : progressHasError ? (
              <div className="text-center py-6 text-sm text-destructive">
                Unable to load weekly insights.
              </div>
            ) : weeklySummaryRows.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No workouts logged in this time window.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                    <tr>
                      <th className="text-left py-2">Week</th>
                      <th className="text-right py-2">Workouts</th>
                      <th className="text-right py-2">Minutes</th>
                      <th className="text-right py-2">Avg RPE</th>
                      <th className="text-right py-2">Calories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {weeklySummaryRows.map((summary) => {
                      const rangeLabel = `${summary.weekStartDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} – ${summary.weekEndDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`;

                      return (
                        <tr key={summary.weekStart}>
                          <td className="py-2">{rangeLabel}</td>
                          <td className="py-2 text-right">{summary.workouts}</td>
                          <td className="py-2 text-right">{summary.minutes.toLocaleString()}</td>
                          <td className="py-2 text-right">{summary.avgRpe.toFixed(1)}</td>
                          <td className="py-2 text-right">{summary.calories.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logsQuery.isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Loading your recent activity…
              </div>
            ) : logsHasError ? (
              <div className="text-center py-8 text-sm text-destructive">
                Unable to load workout history right now.
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No workouts completed yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start your first workout to see progress here
                </p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <WorkoutLogCard
                  key={log.id}
                  log={log}
                  workoutName={log.workout?.name ?? undefined}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Analyzing your workout tags…
              </div>
            ) : progressHasError ? (
              <div className="text-center py-6 text-sm text-destructive">
                Unable to load focus areas.
              </div>
            ) : topTags.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Tag your workouts to surface focus areas and trends.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <Badge key={tag.tag} variant="secondary" className="text-xs">
                    #{tag.tag}
                    <span className="ml-1 text-muted-foreground">({tag.count})</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-chart-3/10 rounded-md">
                <Award className="h-6 w-6 text-chart-3" />
                <div>
                  <p className="font-medium text-sm">First Workout</p>
                  <p className="text-xs text-muted-foreground">Completed your first workout</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-chart-1/10 rounded-md">
                <Calendar className="h-6 w-6 text-chart-1" />
                <div>
                  <p className="font-medium text-sm">5 Day Streak</p>
                  <p className="text-xs text-muted-foreground">Worked out 5 days in a row</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
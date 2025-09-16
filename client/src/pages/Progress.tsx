import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Award } from "lucide-react";
import { ProgressChart } from "@/components/ProgressChart";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutLogCard } from "@/components/WorkoutLogCard";
import { useQuery } from "@tanstack/react-query";
import type { Workout, WorkoutLog } from "@shared/schema";

type WorkoutLogWithWorkout = Omit<WorkoutLog, "completedAt"> & {
  completedAt: string | null;
  workout: (Workout & Record<string, unknown>) | null;
};

interface ProgressResponse {
  dailyStats: Array<{ date: string; workouts: number; streak: number }>;
  totalWorkouts: number;
  averageRating: number;
  currentStreak: number;
  workoutsThisWeek: number;
  totalMinutes: number;
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
    queryKey: ["progress", 7],
    queryFn: () => fetchJson<ProgressResponse>("/api/progress?days=7"),
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
  const totalMinutesValue = progress
    ? progress.totalMinutes
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : 0;
  const averageRatingValue = progress
    ? progress.averageRating.toFixed(1)
    : progressLoading
      ? "…"
      : progressHasError
        ? "—"
        : "0.0";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
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
            subtitle="minutes"
            icon={Clock}
          />
          <StatsCard
            title="Avg Rating"
            value={averageRatingValue}
            subtitle="out of 5"
            icon={TrendingUp}
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
            title="Weekly Activity"
          />
        )}

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
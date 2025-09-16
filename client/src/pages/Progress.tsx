import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Award } from "lucide-react";
import { ProgressChart } from "@/components/ProgressChart";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutLogCard } from "@/components/WorkoutLogCard";
import { WorkoutLog } from "@shared/schema";

export default function ProgressPage() {
  // todo: remove mock functionality
  const [recentLogs] = useState<WorkoutLog[]>([
    {
      id: "1",
      userId: "user1",
      workoutId: "workout1",
      completedAt: new Date(Date.now() - 86400000), // yesterday
      exercises: [
        { name: "Push-ups", sets: 3, reps: 15 },
        { name: "Squats", sets: 3, reps: 20 },
      ],
      notes: "Great workout! Felt strong today.",
      rating: 5,
    },
    {
      id: "2",
      userId: "user1",
      workoutId: "workout2", 
      completedAt: new Date(Date.now() - 172800000), // 2 days ago
      exercises: [
        { name: "Dumbbell Press", sets: 3, reps: 12 },
        { name: "Lunges", sets: 3, reps: 10 },
      ],
      notes: "Challenging but manageable.",
      rating: 4,
    },
  ]);

  const progressData = [
    { date: "Mon", workouts: 1, streak: 1 },
    { date: "Tue", workouts: 0, streak: 0 },
    { date: "Wed", workouts: 1, streak: 1 },
    { date: "Thu", workouts: 1, streak: 2 },
    { date: "Fri", workouts: 0, streak: 0 },
    { date: "Sat", workouts: 1, streak: 1 },
    { date: "Sun", workouts: 1, streak: 2 },
  ];

  const handleViewDetails = (logId: string) => {
    console.log("View workout log details:", logId);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="Current Streak"
            value="5"
            subtitle="days"
            icon={Award}
            trend={{ value: 25, label: "vs last week" }}
          />
          <StatsCard
            title="This Week"
            value="4"
            subtitle="workouts"
            icon={Calendar}
            trend={{ value: 33, label: "vs last week" }}
          />
          <StatsCard
            title="Total Time"
            value="120"
            subtitle="minutes"
            icon={Clock}
            trend={{ value: 15, label: "vs last week" }}
          />
          <StatsCard
            title="Avg Rating"
            value="4.2"
            subtitle="out of 5"
            icon={TrendingUp}
            trend={{ value: 5, label: "vs last week" }}
          />
        </div>

        <ProgressChart 
          data={progressData} 
          title="Weekly Activity"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.length === 0 ? (
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
                  workoutName={`Workout ${log.workoutId}`}
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Star, Calendar, Gauge, Flame, Tag } from "lucide-react";
import type { Workout, WorkoutLog } from "@shared/schema";

interface WorkoutLogCardProps {
  log: WorkoutLog & { workout?: (Workout & Record<string, unknown>) | null };
  workoutName?: string;
  onViewDetails?: (logId: string) => void;
}

export function WorkoutLogCard({ log, workoutName, onViewDetails }: WorkoutLogCardProps) {
  const handleViewDetails = () => {
    console.log("View workout details:", log.id);
    onViewDetails?.(log.id);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const completedAtLabel = log.completedAt ? formatDate(log.completedAt) : "Not completed";
  const durationMinutes = typeof log.durationMinutes === "number" && log.durationMinutes > 0
    ? log.durationMinutes
    : typeof log.workout?.estimatedDuration === "number"
      ? log.workout.estimatedDuration
      : null;
  const caloriesBurned = typeof log.caloriesBurned === "number" && log.caloriesBurned > 0
    ? log.caloriesBurned
    : null;
  const perceivedExertion = typeof log.rpe === "number" && log.rpe > 0 ? log.rpe : null;
  const tagList = Array.isArray(log.tags)
    ? log.tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag) => tag.length > 0)
    : [];

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-workout-log-${log.id}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-chart-3/10 rounded-md">
              <CheckCircle className="h-5 w-5 text-chart-3" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate" data-testid={`text-workout-name-${log.id}`}>
                {workoutName || "Custom Workout"}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{completedAtLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {log.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-xs text-muted-foreground">{log.rating}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              data-testid={`button-view-details-${log.id}`}
            >
              View
            </Button>
          </div>
        </div>

        {log.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {log.notes}
          </p>
        )}

        {(durationMinutes !== null || perceivedExertion !== null || caloriesBurned !== null) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {durationMinutes !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {durationMinutes} min
              </span>
            )}
            {perceivedExertion !== null && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                RPE {perceivedExertion}
              </span>
            )}
            {caloriesBurned !== null && (
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {caloriesBurned} kcal
              </span>
            )}
          </div>
        )}

        {tagList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              Focus
            </span>
            {tagList.map((tag) => (
              <Badge key={`${log.id}-${tag}`} variant="outline" className="text-xs capitalize">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
          {Array.isArray(log.exercises) && (
            <span className="text-xs text-muted-foreground">
              {log.exercises.length} exercises
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
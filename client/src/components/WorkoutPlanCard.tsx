import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target, Play } from "lucide-react";
import { WorkoutPlan } from "@shared/schema";

interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
  onStart?: (planId: string) => void;
  onEdit?: (plan: WorkoutPlan) => void;
}

export function WorkoutPlanCard({ plan, onStart, onEdit }: WorkoutPlanCardProps) {
  const handleStart = () => {
    console.log("Start workout plan:", plan.id);
    onStart?.(plan.id);
  };

  const handleEdit = () => {
    console.log("Edit workout plan:", plan.id);
    onEdit?.(plan);
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-workout-plan-${plan.id}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" data-testid={`text-plan-name-${plan.id}`}>
              {plan.name}
            </h3>
            {plan.description && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {plan.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            data-testid={`button-edit-plan-${plan.id}`}
          >
            Edit
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {plan.goals?.map((goal) => (
            <Badge key={goal} variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {goal.replace("_", " ")}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{plan.weeklyMinutes} min/week</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{plan.dailyMinutes} min/day</span>
            </div>
          </div>
          <Button
            onClick={handleStart}
            size="sm"
            data-testid={`button-start-plan-${plan.id}`}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        </div>
      </div>
    </Card>
  );
}
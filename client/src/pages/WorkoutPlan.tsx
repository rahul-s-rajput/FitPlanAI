import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles } from "lucide-react";
import { WorkoutPlanCard } from "@/components/WorkoutPlanCard";
import { WorkoutPlan } from "@shared/schema";

export default function WorkoutPlanPage() {
  // todo: remove mock functionality
  const [plans] = useState<WorkoutPlan[]>([
    {
      id: "1",
      userId: "user1",
      name: "Strength Building",
      description: "Focus on building overall strength with progressive overload",
      goals: ["strength", "muscle_gain"],
      restrictions: { space: "limited", noise: "no_noise", outdoor: false },
      weeklyMinutes: 180,
      dailyMinutes: 30,
      nutritionalGuidance:
        "Target 120g protein daily, balance carbs around workouts, and add omega-3 rich foods.",
      aiMetadata: {
        provider: "openrouter",
        model: "openai/gpt-oss-120b:free",
        usage: { promptTokens: 320, completionTokens: 450 },
      },
      createdAt: new Date(),
    },
    {
      id: "2",
      userId: "user1",
      name: "Weight Loss Circuit",
      description: "High-intensity circuit training for fat burning",
      goals: ["weight_loss", "endurance"],
      restrictions: { space: "moderate", noise: "low_noise", outdoor: true },
      weeklyMinutes: 240,
      dailyMinutes: 40,
      nutritionalGuidance:
        "Maintain a 300 kcal deficit, prioritise lean proteins and vegetables, and hydrate with 3L water daily.",
      aiMetadata: {
        provider: "openrouter",
        model: "openai/gpt-oss-120b:free",
        usage: { promptTokens: 280, completionTokens: 380 },
      },
      createdAt: new Date(),
    },
  ]);

  const handleCreatePlan = () => {
    console.log("Create new workout plan triggered");
  };

  const handleGenerateAIPlan = () => {
    console.log("Generate AI workout plan triggered");
  };

  const handleStartPlan = (planId: string) => {
    console.log("Start workout plan triggered:", planId);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    console.log("Edit workout plan triggered:", plan);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Workout Plans</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreatePlan}
                  variant="outline"
                  size="sm"
                  data-testid="button-create-plan"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
                <Button 
                  onClick={handleGenerateAIPlan}
                  size="sm"
                  data-testid="button-generate-ai-plan"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No workout plans yet</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleCreatePlan}
                    variant="outline"
                    data-testid="button-create-first-plan"
                  >
                    Create Manual Plan
                  </Button>
                  <Button 
                    onClick={handleGenerateAIPlan}
                    data-testid="button-generate-first-ai-plan"
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            ) : (
              plans.map((plan) => (
                <WorkoutPlanCard
                  key={plan.id}
                  plan={plan}
                  onStart={handleStartPlan}
                  onEdit={handleEditPlan}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => console.log("Start quick workout")}
              data-testid="button-quick-workout"
            >
              🏃‍♂️ Start Quick Workout
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => console.log("View workout history")}
              data-testid="button-workout-history"
            >
              📊 View Workout History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
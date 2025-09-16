import { WorkoutPlanCard } from '../WorkoutPlanCard';

export default function WorkoutPlanCardExample() {
  const samplePlan = {
    id: "1",
    userId: "user1",
    name: "Strength Building",
    description: "Focus on building overall strength with progressive overload",
    goals: ["strength", "muscle_gain"],
    restrictions: { space: "limited", noise: "no_noise", outdoor: false },
    weeklyMinutes: 180,
    dailyMinutes: 30,
    nutritionalGuidance:
      "Aim for 1.8g/kg protein, hydrate regularly, and include leafy greens at each meal.",
    aiMetadata: {
      provider: "openrouter",
      model: "openai/gpt-oss-120b:free",
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date(),
  };

  return (
    <WorkoutPlanCard 
      plan={samplePlan}
      onStart={(planId) => console.log("Start plan:", planId)}
      onEdit={(plan) => console.log("Edit plan:", plan)}
    />
  );
}
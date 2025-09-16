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
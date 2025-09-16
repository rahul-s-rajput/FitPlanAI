import { WorkoutLogCard } from '../WorkoutLogCard';

export default function WorkoutLogCardExample() {
  const sampleLog = {
    id: "1",
    userId: "user1",
    workoutId: "workout1",
    completedAt: new Date(),
    exercises: [
      { name: "Push-ups", sets: 3, reps: 15 },
      { name: "Squats", sets: 3, reps: 20 },
    ],
    notes: "Great workout! Felt strong today.",
    rating: 5,
  };

  return (
    <WorkoutLogCard 
      log={sampleLog}
      workoutName="Morning Strength"
      onViewDetails={(logId) => console.log("View details:", logId)}
    />
  );
}
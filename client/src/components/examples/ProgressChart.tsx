import { ProgressChart } from '../ProgressChart';

export default function ProgressChartExample() {
  const sampleData = [
    { date: "Mon", workouts: 1, streak: 1 },
    { date: "Tue", workouts: 0, streak: 0 },
    { date: "Wed", workouts: 1, streak: 1 },
    { date: "Thu", workouts: 1, streak: 2 },
    { date: "Fri", workouts: 0, streak: 0 },
    { date: "Sat", workouts: 1, streak: 1 },
    { date: "Sun", workouts: 1, streak: 2 },
  ];

  return <ProgressChart data={sampleData} title="Weekly Activity" />;
}
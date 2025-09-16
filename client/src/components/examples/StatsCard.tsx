import { StatsCard } from '../StatsCard';
import { Award } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <StatsCard
      title="Current Streak"
      value="5"
      subtitle="days"
      icon={Award}
      trend={{ value: 25, label: "vs last week" }}
    />
  );
}
import { EquipmentCard } from '../EquipmentCard';

export default function EquipmentCardExample() {
  const sampleEquipment = {
    id: "1",
    userId: "user1",
    type: "dumbbell",
    name: "Adjustable Dumbbells",
    weight: 20,
    quantity: 2,
  };

  return (
    <EquipmentCard 
      equipment={sampleEquipment}
      onEdit={(equipment) => console.log("Edit:", equipment)}
      onDelete={(id) => console.log("Delete:", id)}
    />
  );
}
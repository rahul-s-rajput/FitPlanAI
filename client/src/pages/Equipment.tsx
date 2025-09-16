import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Equipment } from "@shared/schema";

export default function EquipmentPage() {
  // todo: remove mock functionality
  const [equipment] = useState<Equipment[]>([
    {
      id: "1",
      userId: "user1",
      type: "dumbbell",
      name: "Adjustable Dumbbells",
      weight: 20,
      quantity: 2,
    },
    {
      id: "2", 
      userId: "user1",
      type: "resistance_band",
      name: "Resistance Bands Set",
      weight: null,
      quantity: 1,
    },
    {
      id: "3",
      userId: "user1", 
      type: "kettlebell",
      name: "Kettlebell",
      weight: 16,
      quantity: 1,
    },
  ]);

  const handleAddEquipment = () => {
    console.log("Add new equipment triggered");
  };

  const handleEditEquipment = (equipment: Equipment) => {
    console.log("Edit equipment triggered:", equipment);
  };

  const handleDeleteEquipment = (id: string) => {
    console.log("Delete equipment triggered:", id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">My Equipment</CardTitle>
              <Button 
                onClick={handleAddEquipment}
                size="sm"
                data-testid="button-add-equipment"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Equipment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipment.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No equipment added yet</p>
                <Button 
                  onClick={handleAddEquipment}
                  variant="outline" 
                  className="mt-4"
                  data-testid="button-add-first-equipment"
                >
                  Add Your First Equipment
                </Button>
              </div>
            ) : (
              equipment.map((item) => (
                <EquipmentCard
                  key={item.id}
                  equipment={item}
                  onEdit={handleEditEquipment}
                  onDelete={handleDeleteEquipment}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{equipment.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-2">
                  {equipment.reduce((sum, item) => sum + (item.weight || 0), 0)}kg
                </p>
                <p className="text-sm text-muted-foreground">Total Weight</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
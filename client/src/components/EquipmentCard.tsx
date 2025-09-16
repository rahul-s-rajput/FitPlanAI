import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Zap, Weight, MoreHorizontal } from "lucide-react";
import { Equipment } from "@shared/schema";

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: (id: string) => void;
}

const getEquipmentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "dumbbell":
    case "barbell":
      return Dumbbell;
    case "resistance_band":
      return Zap;
    default:
      return Weight;
  }
};

export function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  const Icon = getEquipmentIcon(equipment.type);

  const handleEdit = () => {
    console.log("Edit equipment:", equipment.id);
    onEdit?.(equipment);
  };

  const handleDelete = () => {
    console.log("Delete equipment:", equipment.id);
    onDelete?.(equipment.id);
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-equipment-${equipment.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" data-testid={`text-equipment-name-${equipment.id}`}>
              {equipment.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {equipment.type.replace("_", " ")}
              </Badge>
              {equipment.weight && (
                <Badge variant="outline" className="text-xs">
                  {equipment.weight}kg
                </Badge>
              )}
              {equipment.quantity > 1 && (
                <Badge variant="outline" className="text-xs">
                  x{equipment.quantity}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          data-testid={`button-equipment-menu-${equipment.id}`}
          className="h-8 w-8 flex-shrink-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
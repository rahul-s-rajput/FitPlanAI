import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { EquipmentCard } from "@/components/EquipmentCard";
import { Equipment } from "@shared/schema";
import { getJson, postJson, putJson, deleteRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const equipmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  weight: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    },
    z
      .number({ invalid_type_error: "Weight must be a number" })
      .int("Weight must be a whole number")
      .nonnegative("Weight must be zero or greater")
      .max(500, "Keep weight under 500kg")
      .nullable(),
  ),
  quantity: z
    .coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(20, "Limit to 20 items per entry"),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

type EquipmentPayload = {
  name: string;
  type: string;
  weight: number | null;
  quantity: number;
};

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Equipment | null;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  submitting: boolean;
}

function EquipmentFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  submitting,
}: EquipmentFormDialogProps) {
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      type: "",
      weight: null,
      quantity: 1,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      name: initialData?.name ?? "",
      type: initialData?.type ?? "",
      weight: initialData?.weight ?? null,
      quantity: initialData?.quantity ?? 1,
    });
  }, [form, initialData, open]);

  const title = initialData ? "Edit Equipment" : "Add Equipment";
  const description = initialData
    ? "Update the details for this piece of equipment."
    : "Capture the gear available so plans can stay realistic.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Adjustable dumbbells" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input placeholder="dumbbell, resistance_band" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={500}
                        step={1}
                        value={field.value === null ? "" : String(field.value)}
                        onChange={(event) => field.onChange(event.target.value)}
                        placeholder="10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={20}
                        step={1}
                        value={String(field.value ?? "")}
                        onChange={(event) => field.onChange(event.target.value)}
                        placeholder="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save equipment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function EquipmentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  const equipmentQuery = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: () => getJson<Equipment[]>("/api/equipment"),
    staleTime: 60_000,
  });

  const createEquipmentMutation = useMutation({
    mutationFn: (payload: EquipmentPayload) => postJson<Equipment>("/api/equipment", payload),
    onSuccess: (created) => {
      toast({
        title: "Equipment added",
        description: `${created.name} is now in your gear list.`,
      });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setFormOpen(false);
      setEditingEquipment(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to save equipment.";
      toast({
        title: "Failed to add equipment",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EquipmentPayload }) =>
      putJson<Equipment>(`/api/equipment/${id}`, payload),
    onSuccess: (updated) => {
      toast({
        title: "Equipment updated",
        description: `${updated.name} has been refreshed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setFormOpen(false);
      setEditingEquipment(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to update equipment.";
      toast({
        title: "Failed to update equipment",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(`/api/equipment/${id}`),
    onSuccess: () => {
      toast({
        title: "Equipment deleted",
        description: "The item has been removed from your list.",
      });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      if (editingEquipment && equipmentToDelete && editingEquipment.id === equipmentToDelete.id) {
        setFormOpen(false);
        setEditingEquipment(null);
      }
      setEquipmentToDelete(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to delete equipment.";
      toast({
        title: "Failed to delete equipment",
        description: message,
        variant: "destructive",
      });
    },
  });

  const equipment = equipmentQuery.data ?? [];
  const totalPieces = useMemo(
    () => equipment.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    [equipment],
  );
  const totalWeightKg = useMemo(
    () => equipment.reduce((sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1), 0),
    [equipment],
  );

  const isSaving = createEquipmentMutation.isPending || updateEquipmentMutation.isPending;

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setFormOpen(true);
  };

  const handleDeleteEquipment = (itemId: string) => {
    const target = equipment.find((item) => item.id === itemId) ?? null;
    setEquipmentToDelete(target);
  };

  const handleFormSubmit = async (values: EquipmentFormValues) => {
    const payload: EquipmentPayload = {
      name: values.name.trim(),
      type: values.type.trim(),
      quantity: values.quantity,
      weight: values.weight,
    };

    try {
      if (editingEquipment) {
        await updateEquipmentMutation.mutateAsync({ id: editingEquipment.id, payload });
      } else {
        await createEquipmentMutation.mutateAsync(payload);
      }
    } catch {
      // Errors handled within mutation callbacks
    }
  };

  const handleConfirmDelete = async () => {
    if (!equipmentToDelete) return;
    try {
      await deleteEquipmentMutation.mutateAsync(equipmentToDelete.id);
    } catch {
      // handled by mutation onError
    }
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
            {equipmentQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : equipmentQuery.error ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Unable to load equipment. Please try again shortly.
              </div>
            ) : equipment.length === 0 ? (
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
                <p className="text-2xl font-bold text-primary">{totalPieces.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-2">
                  {totalWeightKg.toLocaleString()}kg
                </p>
                <p className="text-sm text-muted-foreground">Combined Weight</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EquipmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingEquipment(null);
          }
        }}
        initialData={editingEquipment}
        onSubmit={handleFormSubmit}
        submitting={isSaving}
      />

      <AlertDialog
        open={Boolean(equipmentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setEquipmentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment</AlertDialogTitle>
            <AlertDialogDescription>
              {equipmentToDelete
                ? `Remove ${equipmentToDelete.name} from your equipment list? This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEquipmentMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteEquipmentMutation.isPending}
              className="gap-2"
            >
              {deleteEquipmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

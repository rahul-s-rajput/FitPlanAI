import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { WorkoutPlanCard } from "@/components/WorkoutPlanCard";
import type { WorkoutPlan } from "@shared/schema";
import { getJson, postJson, putJson, deleteRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const SPACE_OPTIONS = [
  { value: "limited", label: "Limited space" },
  { value: "moderate", label: "Moderate space" },
  { value: "ample", label: "Dedicated area" },
  { value: "full_gym", label: "Full gym access" },
];

const NOISE_OPTIONS = [
  { value: "no_noise", label: "No noise" },
  { value: "low_noise", label: "Low noise" },
  { value: "normal", label: "Normal noise" },
];

type Restrictions = {
  space: string;
  noise: string;
  outdoor: boolean;
};

const restrictionSchema = z.object({
  space: z.string().min(1, "Select a space preference"),
  noise: z.string().min(1, "Select a noise preference"),
  outdoor: z.boolean(),
});

function parseGoals(input: string): string[] {
  return input
    .split(",")
    .map((goal) => goal.trim())
    .filter((goal) => goal.length > 0);
}

const planFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    goalsText: z.string().min(1, "Enter at least one goal"),
    restrictions: restrictionSchema,
    weeklyMinutes: z
      .coerce
      .number({ invalid_type_error: "Weekly minutes must be a number" })
      .int("Weekly minutes must be a whole number")
      .min(60, "Aim for at least 60 minutes per week")
      .max(1_200, "Keep weekly minutes under 1200"),
    dailyMinutes: z
      .coerce
      .number({ invalid_type_error: "Daily minutes must be a number" })
      .int("Daily minutes must be a whole number")
      .min(10, "Aim for at least 10 minutes per day")
      .max(300, "Keep daily sessions under 300 minutes"),
    nutritionalGuidance: z.string().min(1, "Provide nutritional guidance"),
  })
  .refine((data) => parseGoals(data.goalsText).length > 0, {
    path: ["goalsText"],
    message: "Enter at least one goal",
  })
  .refine((data) => data.dailyMinutes <= data.weeklyMinutes, {
    path: ["dailyMinutes"],
    message: "Daily minutes cannot exceed weekly minutes",
  });

type PlanFormValues = z.infer<typeof planFormSchema>;

type PlanPayload = {
  name: string;
  description: string;
  goals: string[];
  restrictions: Restrictions;
  weeklyMinutes: number;
  dailyMinutes: number;
  nutritionalGuidance: string;
};

const generatePlanSchema = z
  .object({
    goalsText: z.string().min(1, "Enter at least one goal"),
    restrictions: restrictionSchema,
    weeklyMinutes: z
      .coerce
      .number({ invalid_type_error: "Weekly minutes must be a number" })
      .int("Weekly minutes must be a whole number")
      .min(60, "Aim for at least 60 minutes per week")
      .max(1_200, "Keep weekly minutes under 1200"),
    dailyMinutes: z
      .coerce
      .number({ invalid_type_error: "Daily minutes must be a number" })
      .int("Daily minutes must be a whole number")
      .min(10, "Aim for at least 10 minutes per day")
      .max(300, "Keep daily sessions under 300 minutes"),
  })
  .refine((data) => parseGoals(data.goalsText).length > 0, {
    path: ["goalsText"],
    message: "Enter at least one goal",
  })
  .refine((data) => data.dailyMinutes <= data.weeklyMinutes, {
    path: ["dailyMinutes"],
    message: "Daily minutes cannot exceed weekly minutes",
  });

type GeneratePlanFormValues = z.infer<typeof generatePlanSchema>;

type GeneratePlanPayload = {
  goals: string[];
  restrictions: Restrictions;
  weeklyMinutes: number;
  dailyMinutes: number;
};

interface GeneratePlanResponse {
  plan: WorkoutPlan;
  nutritionalGuidance: string;
  aiMetadata?: Record<string, unknown> | null;
}

function ensureOption(
  value: string,
  options: Array<{ value: string; label: string }>,
): Array<{ value: string; label: string }> {
  if (!value) {
    return options;
  }
  return options.some((option) => option.value === value)
    ? options
    : [...options, { value, label: value.replaceAll("_", " ") }];
}

function extractRestrictions(restrictions: unknown): Restrictions {
  if (!restrictions || typeof restrictions !== "object") {
    return { space: "limited", noise: "normal", outdoor: false };
  }
  const record = restrictions as Record<string, unknown>;
  const space = typeof record.space === "string" && record.space.length > 0 ? record.space : "limited";
  const noise = typeof record.noise === "string" && record.noise.length > 0 ? record.noise : "normal";
  const outdoorValue = record.outdoor;
  const outdoor =
    typeof outdoorValue === "boolean"
      ? outdoorValue
      : typeof outdoorValue === "string"
        ? outdoorValue.toLowerCase() === "true"
        : Boolean(outdoorValue);
  return { space, noise, outdoor };
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan: WorkoutPlan | null;
  submitting: boolean;
  deleting: boolean;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function PlanFormDialog({
  open,
  onOpenChange,
  initialPlan,
  submitting,
  deleting,
  onSubmit,
  onDelete,
}: PlanFormDialogProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goalsText: "strength, mobility",
      restrictions: { space: "limited", noise: "normal", outdoor: false },
      weeklyMinutes: 150,
      dailyMinutes: 30,
      nutritionalGuidance: "Maintain protein intake around 1.6g/kg and hydrate daily.",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaults = initialPlan
      ? {
          name: initialPlan.name ?? "",
          description: initialPlan.description ?? "",
          goalsText: Array.isArray(initialPlan.goals) ? initialPlan.goals.join(", ") : "",
          restrictions: extractRestrictions(initialPlan.restrictions),
          weeklyMinutes: initialPlan.weeklyMinutes ?? 150,
          dailyMinutes: initialPlan.dailyMinutes ?? 30,
          nutritionalGuidance: initialPlan.nutritionalGuidance ?? "",
        }
      : {
          name: "",
          description: "",
          goalsText: "strength, mobility",
          restrictions: { space: "limited", noise: "normal", outdoor: false },
          weeklyMinutes: 150,
          dailyMinutes: 30,
          nutritionalGuidance: "Maintain protein intake around 1.6g/kg and hydrate daily.",
        };

    form.reset(defaults);
  }, [form, initialPlan, open]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const spaceValue = form.watch("restrictions.space");
  const noiseValue = form.watch("restrictions.noise");

  const spaceOptions = ensureOption(spaceValue, SPACE_OPTIONS);
  const noiseOptions = ensureOption(noiseValue, NOISE_OPTIONS);

  const isEdit = Boolean(initialPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit workout plan" : "Create workout plan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Refine the schedule, goals, or guidance for this plan."
              : "Define goals, constraints, and guidance for a personalized plan."}
          </DialogDescription>
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
                    <Input placeholder="Strong at Home" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Weekly structure, focus areas, or key notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goalsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="strength, conditioning, mobility"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="restrictions.space"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Space</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {spaceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restrictions.noise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noise</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select noise level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {noiseOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="restrictions.outdoor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outdoor sessions</FormLabel>
                  <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
                    <div className="space-y-1">
                      <Label htmlFor="outdoor-toggle" className="text-sm font-medium">
                        Outdoor workouts allowed
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle on if running or outdoor circuits are acceptable.
                      </p>
                    </div>
                    <Switch
                      id="outdoor-toggle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weeklyMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={30}
                        max={1200}
                        step={10}
                        value={String(field.value ?? "")}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dailyMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={10}
                        max={300}
                        step={5}
                        value={String(field.value ?? "")}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nutritionalGuidance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nutritional guidance</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Summarize daily intake, hydration, and recovery targets"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {isEdit && onDelete ? (
                <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" className="justify-start text-destructive">
                      Delete plan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Removing the plan will also delete its associated workouts.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await onDelete();
                            setConfirmDeleteOpen(false);
                          } catch {
                            // handled by mutation callbacks
                          }
                        }}
                        disabled={deleting}
                        className="gap-2"
                      >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span className="hidden sm:block" />
              )}
              <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting || deleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || deleting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save plan
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface GeneratePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (values: GeneratePlanFormValues) => Promise<void>;
}

function GeneratePlanDialog({ open, onOpenChange, submitting, onSubmit }: GeneratePlanDialogProps) {
  const form = useForm<GeneratePlanFormValues>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      goalsText: "strength, conditioning",
      restrictions: { space: "limited", noise: "low_noise", outdoor: false },
      weeklyMinutes: 150,
      dailyMinutes: 30,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset({
      goalsText: "strength, conditioning",
      restrictions: { space: "limited", noise: "low_noise", outdoor: false },
      weeklyMinutes: 150,
      dailyMinutes: 30,
    });
  }, [form, open]);

  const spaceValue = form.watch("restrictions.space");
  const noiseValue = form.watch("restrictions.noise");

  const spaceOptions = ensureOption(spaceValue, SPACE_OPTIONS);
  const noiseOptions = ensureOption(noiseValue, NOISE_OPTIONS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate AI workout plan</DialogTitle>
          <DialogDescription>
            Provide goals, constraints, and preferred schedule. FitPlanAI will craft a research-backed plan with nutrition tips.
          </DialogDescription>
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
              name="goalsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="fat loss, core strength, mobility"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="restrictions.space"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Space</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {spaceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restrictions.noise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noise</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select noise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {noiseOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="restrictions.outdoor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outdoor sessions</FormLabel>
                  <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
                    <div className="space-y-1">
                      <Label htmlFor="generate-outdoor" className="text-sm font-medium">
                        Allow outdoor training
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable to include running or outdoor interval work.
                      </p>
                    </div>
                    <Switch
                      id="generate-outdoor"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weeklyMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={30}
                        max={1200}
                        step={10}
                        value={String(field.value ?? "")}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dailyMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={10}
                        max={300}
                        step={5}
                        value={String(field.value ?? "")}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                Generate plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkoutPlanPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const plansQuery = useQuery<WorkoutPlan[]>({
    queryKey: ["workout-plans"],
    queryFn: () => getJson<WorkoutPlan[]>("/api/workout-plans"),
    staleTime: 60_000,
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: PlanPayload) => postJson<WorkoutPlan>("/api/workout-plans", payload),
    onSuccess: (plan) => {
      toast({
        title: "Plan created",
        description: `${plan.name} has been added to your library.`,
      });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      setManualDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to create the plan.";
      toast({
        title: "Failed to create plan",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PlanPayload }) =>
      putJson<WorkoutPlan>(`/api/workout-plans/${id}`, payload),
    onSuccess: (plan) => {
      toast({
        title: "Plan updated",
        description: `${plan.name} has been refreshed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      setManualDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to update the plan.";
      toast({
        title: "Failed to update plan",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(`/api/workout-plans/${id}`),
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "The plan and its workouts have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      setManualDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to delete the plan.";
      toast({
        title: "Failed to delete plan",
        description: message,
        variant: "destructive",
      });
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: (payload: GeneratePlanPayload) =>
      postJson<GeneratePlanResponse>("/api/generate-workout-plan", payload),
    onSuccess: (response) => {
      const planName = response.plan?.name ?? "Workout plan";
      toast({
        title: "Plan generated",
        description: `${planName} is ready to explore.`,
      });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      setGenerateDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to generate a plan right now.";
      toast({
        title: "Plan generation failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const plans = plansQuery.data ?? [];

  const newestPlan = useMemo(
    () => (plans.length ? plans[0] : null),
    [plans],
  );

  const isSaving = createPlanMutation.isPending || updatePlanMutation.isPending;

  const handleManualSubmit = async (values: PlanFormValues) => {
    const goals = parseGoals(values.goalsText);
    const payload: PlanPayload = {
      name: values.name.trim(),
      description: values.description.trim(),
      goals,
      restrictions: values.restrictions,
      weeklyMinutes: values.weeklyMinutes,
      dailyMinutes: values.dailyMinutes,
      nutritionalGuidance: values.nutritionalGuidance.trim(),
    };

    try {
      if (editingPlan) {
        await updatePlanMutation.mutateAsync({ id: editingPlan.id, payload });
      } else {
        await createPlanMutation.mutateAsync(payload);
      }
    } catch {
      // handled by mutation callbacks
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlan) return;
    try {
      await deletePlanMutation.mutateAsync(editingPlan.id);
    } catch {
      // handled by mutation callbacks
    }
  };

  const handleGenerateSubmit = async (values: GeneratePlanFormValues) => {
    const goals = parseGoals(values.goalsText);
    try {
      await generatePlanMutation.mutateAsync({
        goals,
        restrictions: values.restrictions,
        weeklyMinutes: values.weeklyMinutes,
        dailyMinutes: values.dailyMinutes,
      });
    } catch {
      // handled by mutation callbacks
    }
  };

  const handleStartPlan = (planId: string) => {
    console.log("Start workout plan triggered:", planId);
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
                  onClick={() => {
                    setEditingPlan(null);
                    setManualDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  data-testid="button-create-plan"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
                <Button
                  onClick={() => setGenerateDialogOpen(true)}
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
            {plansQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            ) : plansQuery.error ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Unable to load plans. Please try again in a moment.
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No workout plans yet</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setEditingPlan(null);
                      setManualDialogOpen(true);
                    }}
                    variant="outline"
                    data-testid="button-create-first-plan"
                  >
                    Create Manual Plan
                  </Button>
                  <Button
                    onClick={() => setGenerateDialogOpen(true)}
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
                  onEdit={(selected) => {
                    setEditingPlan(selected);
                    setManualDialogOpen(true);
                  }}
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
            {newestPlan && (
              <Button
                variant="secondary"
                className="w-full justify-start gap-3"
                onClick={() => handleStartPlan(newestPlan.id)}
              >
                ⭐ Resume {newestPlan.name}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <PlanFormDialog
        open={manualDialogOpen}
        onOpenChange={(open) => {
          setManualDialogOpen(open);
          if (!open) {
            setEditingPlan(null);
          }
        }}
        initialPlan={editingPlan}
        submitting={isSaving}
        deleting={deletePlanMutation.isPending}
        onSubmit={handleManualSubmit}
        onDelete={editingPlan ? handleDeletePlan : undefined}
      />

      <GeneratePlanDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        submitting={generatePlanMutation.isPending}
        onSubmit={handleGenerateSubmit}
      />
    </div>
  );
}

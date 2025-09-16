import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AIServiceError, generateWorkoutPlan } from "./ai";
import {
  insertEquipmentSchema,
  insertWorkoutPlanSchema,
  insertWorkoutLogSchema,
  updateWorkoutLogSchema,
  type Workout,
  type WorkoutLog,
} from "@shared/schema";
import { z } from "zod";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function registerRoutes(app: Express): Promise<Server> {
  const DEMO_USER_USERNAME = "demo-user";
  const FALLBACK_DEMO_USER_ID = "demo-user";

  async function resolveDemoUserId(): Promise<string> {
    const existingById = await storage.getUser(FALLBACK_DEMO_USER_ID);
    if (existingById) {
      return existingById.id;
    }

    const existingByUsername = await storage.getUserByUsername(DEMO_USER_USERNAME);
    if (existingByUsername) {
      return existingByUsername.id;
    }

    try {
      const created = await storage.createUser({
        id: FALLBACK_DEMO_USER_ID,
        username: DEMO_USER_USERNAME,
        password: "demo-user-password",
      });
      return created.id;
    } catch (error) {
      const fallback = await storage.getUserByUsername(DEMO_USER_USERNAME);
      if (fallback) {
        return fallback.id;
      }

      console.error("Failed to provision demo user:", error);
      throw error;
    }
  }

  const demoUserId = await resolveDemoUserId();

  function formatValidationIssues(error: z.ZodError) {
    return error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  async function ensureWorkoutBelongsToDemoUser(
    workoutId: string,
  ): Promise<{ workout: Workout } | { error: { status: number; message: string } }> {
    const workout = await storage.getWorkout(workoutId);
    if (!workout) {
      return { error: { status: 404, message: "Workout not found" } };
    }

    const plan = await storage.getWorkoutPlan(workout.planId);
    if (!plan || plan.userId !== demoUserId) {
      return {
        error: {
          status: 403,
          message: "Workout does not belong to the active user",
        },
      };
    }

    return { workout };
  }

  async function enrichLogsWithWorkouts(
    logs: WorkoutLog[],
  ): Promise<Array<WorkoutLog & { workout: Workout | null }>> {
    const workoutIds = Array.from(
      new Set(
        logs
          .map((log) => log.workoutId)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    );

    if (workoutIds.length === 0) {
      return logs.map((log) => ({ ...log, workout: null as Workout | null }));
    }

    const workouts = await storage.getWorkoutsByIds(workoutIds);
    const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));

    return logs.map((log) => ({
      ...log,
      workout: log.workoutId ? workoutMap.get(log.workoutId) ?? null : null,
    }));
  }

  function getExerciseCount(exercises: unknown): number {
    return Array.isArray(exercises) ? exercises.length : 0;
  }

  // Equipment endpoints
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await storage.getUserEquipment(demoUserId);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse({ ...req.body, userId: demoUserId });
      const equipment = await storage.createEquipment(validatedData);
      res.status(201).json(equipment);
    } catch (error) {
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  app.put("/api/equipment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertEquipmentSchema.partial().parse(req.body);
      const equipment = await storage.updateEquipment(id, updates);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEquipment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // Workout Plan endpoints
  app.get("/api/workout-plans", async (req, res) => {
    try {
      const plans = await storage.getUserWorkoutPlans(demoUserId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout plans" });
    }
  });

  app.get("/api/workout-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getWorkoutPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Workout plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout plan" });
    }
  });

  app.post("/api/workout-plans", async (req, res) => {
    try {
      const validatedData = insertWorkoutPlanSchema.parse({ ...req.body, userId: demoUserId });
      const plan = await storage.createWorkoutPlan(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout plan data" });
    }
  });

  app.put("/api/workout-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkoutPlanSchema.partial().parse(req.body);
      const plan = await storage.updateWorkoutPlan(id, updates);
      if (!plan) {
        return res.status(404).json({ error: "Workout plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout plan data" });
    }
  });

  app.post("/api/generate-workout-plan", async (req, res) => {
    const requestSchema = z.object({
      goals: z.array(z.string().min(1)).min(1, "At least one goal is required"),
      restrictions: z.object({
        space: z.string().min(1),
        noise: z.string().min(1),
        outdoor: z.boolean(),
      }),
      weeklyMinutes: z.coerce
        .number()
        .int()
        .positive("Weekly minutes must be greater than 0"),
      dailyMinutes: z.coerce
        .number()
        .int()
        .positive("Daily minutes must be greater than 0"),
    });

    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
      const details = validation.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        error: "Invalid generate-workout-plan payload",
        details,
      });
    }

    const { goals, restrictions, weeklyMinutes, dailyMinutes } = validation.data;

    try {
      const equipment = await storage.getUserEquipment(demoUserId);

      const { plan: generatedPlan, metadata: aiMetadata } = await generateWorkoutPlan({
        equipment,
        goals,
        restrictions,
        weeklyMinutes,
        dailyMinutes,
      });

      const savedPlan = await storage.createWorkoutPlan({
        userId: demoUserId,
        name: generatedPlan.name,
        description: generatedPlan.description,
        goals,
        restrictions,
        weeklyMinutes,
        dailyMinutes,
        nutritionalGuidance: generatedPlan.nutritionalGuidance,
        aiMetadata,
      });

      const savedWorkouts = [];
      for (const workout of generatedPlan.workouts) {
        const savedWorkout = await storage.createWorkout({
          planId: savedPlan.id,
          name: workout.name,
          exercises: workout.exercises,
          estimatedDuration: workout.estimatedDuration,
          dayOfWeek: workout.dayOfWeek,
        });
        savedWorkouts.push(savedWorkout);
      }

      res.status(201).json({
        plan: savedPlan,
        workouts: savedWorkouts,
        nutritionalGuidance: generatedPlan.nutritionalGuidance,
        aiMetadata,
      });
    } catch (error) {
      if (error instanceof AIServiceError) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error("Error generating workout plan:", error);
      res.status(500).json({ error: "Failed to generate workout plan" });
    }
  });

  app.delete("/api/workout-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Delete associated workouts first
      const planWorkouts = await storage.getPlanWorkouts(id);
      for (const workout of planWorkouts) {
        await storage.deleteWorkout(workout.id);
      }
      
      const deleted = await storage.deleteWorkoutPlan(id);
      if (!deleted) {
        return res.status(404).json({ error: "Workout plan not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout plan" });
    }
  });

  // Individual Workout endpoints
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workout = await storage.getWorkout(id);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout" });
    }
  });

  app.get("/api/workout-plans/:planId/workouts", async (req, res) => {
    try {
      const { planId } = req.params;
      const workouts = await storage.getPlanWorkouts(planId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plan workouts" });
    }
  });

  app.put("/api/workouts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body; // Basic validation since this is a flexible structure
      const workout = await storage.updateWorkout(id, updates);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout data" });
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkout(id);
      if (!deleted) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  // Workout Log endpoints
  app.get("/api/workout-logs", async (req, res) => {
    const queryValidation = z
      .object({
        limit: z
          .preprocess((value) => {
            const first = Array.isArray(value) ? value[0] : value;
            if (first === undefined || first === null || first === "") {
              return undefined;
            }
            return first;
          }, z.coerce.number().int().positive().max(100))
          .optional(),
      })
      .safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: "Invalid workout log query parameters",
        details: formatValidationIssues(queryValidation.error),
      });
    }

    const limit = queryValidation.data.limit ?? 20;

    try {
      const logs = await storage.getUserWorkoutLogs(demoUserId, limit);
      const logsWithWorkouts = await enrichLogsWithWorkouts(logs);
      res.json(logsWithWorkouts);
    } catch (error) {
      console.error("Failed to fetch workout logs:", error);
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    const validation = insertWorkoutLogSchema.safeParse({
      ...req.body,
      userId: demoUserId,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid workout log data",
        details: formatValidationIssues(validation.error),
      });
    }

    const payload = validation.data;

    if (payload.workoutId) {
      const ownership = await ensureWorkoutBelongsToDemoUser(payload.workoutId);
      if ("error" in ownership) {
        return res.status(ownership.error.status).json({ error: ownership.error.message });
      }
    }

    try {
      const createdLog = await storage.createWorkoutLog(payload);
      const [logWithWorkout] = await enrichLogsWithWorkouts([createdLog]);
      res.status(201).json(logWithWorkout);
    } catch (error) {
      console.error("Failed to create workout log:", error);
      res.status(500).json({ error: "Failed to create workout log" });
    }
  });

  app.put("/api/workout-logs/:id", async (req, res) => {
    const { id } = req.params;

    const existingLog = await storage.getWorkoutLog(id);
    if (!existingLog || existingLog.userId !== demoUserId) {
      return res.status(404).json({ error: "Workout log not found" });
    }

    const validation = updateWorkoutLogSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid workout log data",
        details: formatValidationIssues(validation.error),
      });
    }

    const updates = validation.data;

    if (updates.workoutId !== undefined) {
      if (updates.workoutId) {
        const ownership = await ensureWorkoutBelongsToDemoUser(updates.workoutId);
        if ("error" in ownership) {
          return res.status(ownership.error.status).json({ error: ownership.error.message });
        }
      } else {
        const exerciseCount = updates.exercises !== undefined
          ? getExerciseCount(updates.exercises)
          : getExerciseCount(existingLog.exercises);

        if (exerciseCount === 0) {
          return res.status(400).json({
            error: "Custom workout logs must include at least one exercise.",
          });
        }
      }
    } else if (updates.exercises !== undefined) {
      const exerciseCount = getExerciseCount(updates.exercises);
      if (exerciseCount === 0 && !existingLog.workoutId) {
        return res.status(400).json({
          error: "Custom workout logs must include at least one exercise.",
        });
      }
    }

    try {
      const updated = await storage.updateWorkoutLog(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Workout log not found" });
      }

      const [logWithWorkout] = await enrichLogsWithWorkouts([updated]);
      res.json(logWithWorkout);
    } catch (error) {
      console.error("Failed to update workout log:", error);
      res.status(500).json({ error: "Failed to update workout log" });
    }
  });

  app.delete("/api/workout-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkoutLog(id);
      if (!deleted) {
        return res.status(404).json({ error: "Workout log not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout log" });
    }
  });

  // Progress endpoint
  app.get("/api/progress", async (req, res) => {
    const queryValidation = z
      .object({
        days: z
          .preprocess((value) => {
            const first = Array.isArray(value) ? value[0] : value;
            if (first === undefined || first === null || first === "") {
              return undefined;
            }
            return first;
          }, z.coerce.number().int().min(1).max(31))
          .optional(),
      })
      .safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: "Invalid progress query parameters",
        details: formatValidationIssues(queryValidation.error),
      });
    }

    const daysNumber = queryValidation.data.days ?? 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNumber - 1) * DAY_IN_MS);

    try {
      const logs = await storage.getWorkoutLogsByDateRange(demoUserId, startDate, endDate);
      const logsWithWorkouts = await enrichLogsWithWorkouts(logs);

      const logDateCounts = new Map<string, number>();
      for (const log of logs) {
        if (!log.completedAt) continue;
        const completed = log.completedAt instanceof Date ? log.completedAt : new Date(log.completedAt);
        const key = completed.toDateString();
        logDateCounts.set(key, (logDateCounts.get(key) ?? 0) + 1);
      }

      const dailyStats: Array<{ date: string; workouts: number; streak: number }> = [];
      let runningStreak = 0;
      for (let i = daysNumber - 1; i >= 0; i--) {
        const currentDate = new Date(endDate.getTime() - i * DAY_IN_MS);
        const key = currentDate.toDateString();
        const workoutsForDay = logDateCounts.get(key) ?? 0;
        runningStreak = workoutsForDay > 0 ? runningStreak + 1 : 0;

        dailyStats.push({
          date: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
          workouts: workoutsForDay,
          streak: runningStreak,
        });
      }

      const totalWorkouts = logs.length;
      const ratings = logs
        .map((log) => (typeof log.rating === "number" && log.rating > 0 ? log.rating : null))
        .filter((rating): rating is number => rating !== null);
      const averageRating = ratings.length
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
        : 0;

      const daysForWeek = Math.min(daysNumber, 7);
      const weekStart = new Date(endDate.getTime() - (daysForWeek - 1) * DAY_IN_MS);
      const workoutsThisWeek = logs.filter((log) => {
        if (!log.completedAt) {
          return false;
        }
        const completed = log.completedAt instanceof Date ? log.completedAt : new Date(log.completedAt);
        return completed >= weekStart;
      }).length;

      const totalMinutes = logsWithWorkouts.reduce((total, log) => {
        if (log.workout?.estimatedDuration) {
          return total + log.workout.estimatedDuration;
        }

        if (Array.isArray(log.exercises)) {
          const exerciseMinutes = log.exercises.reduce((exerciseTotal, exercise) => {
            if (!exercise || typeof exercise !== "object") {
              return exerciseTotal;
            }

            const minutesFromMinutes = typeof (exercise as any).durationMinutes === "number"
              ? (exercise as any).durationMinutes
              : undefined;
            const minutesFromGeneric = typeof (exercise as any).duration === "number"
              ? (exercise as any).duration
              : undefined;
            const minutesFromSeconds = typeof (exercise as any).durationSeconds === "number"
              ? Math.round((exercise as any).durationSeconds / 60)
              : undefined;

            const derivedMinutes = minutesFromMinutes ?? minutesFromGeneric ?? minutesFromSeconds ?? 0;
            return exerciseTotal + derivedMinutes;
          }, 0);

          return total + exerciseMinutes;
        }

        return total;
      }, 0);

      res.json({
        dailyStats,
        totalWorkouts,
        averageRating,
        currentStreak: calculateCurrentStreak(logs),
        workoutsThisWeek,
        totalMinutes: Math.max(0, Math.round(totalMinutes)),
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateCurrentStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) {
    return 0;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const loggedDates = new Set(
    logs
      .filter((log) => log.completedAt)
      .map((log) => {
        const completed = log.completedAt instanceof Date ? log.completedAt : new Date(log.completedAt!);
        const normalized = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate());
        return normalized.toDateString();
      }),
  );

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(todayStart.getTime() - i * DAY_IN_MS);
    const key = checkDate.toDateString();
    if (loggedDates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

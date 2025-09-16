import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateWorkoutPlan, generateNutritionalGuidance } from "./openai";
import { insertEquipmentSchema, insertWorkoutPlanSchema, insertWorkoutLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user for demo purposes
  const DEMO_USER_ID = "demo-user";

  // Equipment endpoints
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await storage.getUserEquipment(DEMO_USER_ID);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse({ ...req.body, userId: DEMO_USER_ID });
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
      const plans = await storage.getUserWorkoutPlans(DEMO_USER_ID);
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
      const validatedData = insertWorkoutPlanSchema.parse({ ...req.body, userId: DEMO_USER_ID });
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
    try {
      // Validate request body
      const requestSchema = z.object({
        goals: z.array(z.string()).min(1, "At least one goal is required"),
        restrictions: z.object({
          space: z.string(),
          noise: z.string(),
          outdoor: z.boolean()
        }),
        weeklyMinutes: z.number().min(1, "Weekly minutes must be greater than 0"),
        dailyMinutes: z.number().min(1, "Daily minutes must be greater than 0")
      });
      
      const { goals, restrictions, weeklyMinutes, dailyMinutes } = requestSchema.parse(req.body);
      
      // Get user's equipment
      const equipment = await storage.getUserEquipment(DEMO_USER_ID);
      
      // Generate AI workout plan
      const generatedPlan = await generateWorkoutPlan({
        equipment,
        goals,
        restrictions,
        weeklyMinutes,
        dailyMinutes,
      });

      // Save the generated plan
      const savedPlan = await storage.createWorkoutPlan({
        userId: DEMO_USER_ID,
        name: generatedPlan.name,
        description: generatedPlan.description,
        goals,
        restrictions,
        weeklyMinutes,
        dailyMinutes,
      });

      // Save individual workouts from the generated plan
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
      });
    } catch (error) {
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
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getUserWorkoutLogs(DEMO_USER_ID, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const log = await storage.createWorkoutLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout log data" });
    }
  });

  app.put("/api/workout-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkoutLogSchema.partial().parse(req.body);
      const log = await storage.updateWorkoutLog(id, updates);
      if (!log) {
        return res.status(404).json({ error: "Workout log not found" });
      }
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout log data" });
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
    try {
      const { days = 7 } = req.query;
      const daysNumber = parseInt(days as string);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (daysNumber * 24 * 60 * 60 * 1000));
      
      const logs = await storage.getWorkoutLogsByDateRange(DEMO_USER_ID, startDate, endDate);
      
      // Calculate daily stats
      const dailyStats = [];
      for (let i = 0; i < daysNumber; i++) {
        const date = new Date(endDate.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayLogs = logs.filter(log => {
          const logDate = new Date(log.completedAt!);
          return logDate.toDateString() === date.toDateString();
        });
        
        dailyStats.unshift({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          workouts: dayLogs.length,
          streak: dayLogs.length > 0 ? 1 : 0,
        });
      }
      
      // Calculate overall stats
      const totalWorkouts = logs.length;
      const logsWithRating = logs.filter(log => log.rating && log.rating > 0);
      const averageRating = logsWithRating.length > 0 
        ? logsWithRating.reduce((sum, log) => sum + (log.rating || 0), 0) / logsWithRating.length
        : 0;
      
      res.json({
        dailyStats,
        totalWorkouts,
        averageRating: Math.round(averageRating * 10) / 10,
        currentStreak: calculateCurrentStreak(logs),
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateCurrentStreak(logs: any[]): number {
  if (logs.length === 0) return 0;
  
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 30; i++) { // Check last 30 days
    const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
    const hasWorkout = logs.some(log => {
      const logDate = new Date(log.completedAt!);
      return logDate.toDateString() === checkDate.toDateString();
    });
    
    if (hasWorkout) {
      streak++;
    } else if (i > 0) { // Allow today to be without workout
      break;
    }
  }
  
  return streak;
}

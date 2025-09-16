import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // "dumbbell", "resistance_band", "kettlebell", etc.
  name: text("name").notNull(),
  weight: integer("weight"), // in kg, null for bodyweight equipment
  quantity: integer("quantity").notNull().default(1),
});

export const workoutPlans = pgTable("workout_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  goals: text("goals").array(), // ["strength", "weight_loss", "muscle_gain"]
  restrictions: jsonb("restrictions"), // {space: "limited", noise: "no_noise", outdoor: true}
  weeklyMinutes: integer("weekly_minutes").notNull(),
  dailyMinutes: integer("daily_minutes").notNull(),
  nutritionalGuidance: text("nutritional_guidance"),
  aiMetadata: jsonb("ai_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull(),
  name: text("name").notNull(),
  exercises: jsonb("exercises"), // [{name, sets, reps, duration, equipment}]
  estimatedDuration: integer("estimated_duration"), // in minutes
  dayOfWeek: integer("day_of_week"), // 0-6
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workoutId: varchar("workout_id"),
  completedAt: timestamp("completed_at").defaultNow(),
  exercises: jsonb("exercises"), // actual performed exercises
  notes: text("notes"),
  rating: integer("rating"), // 1-5 difficulty/satisfaction
  rpe: integer("rpe"), // Rating of perceived exertion (1-10)
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: integer("calories_burned"),
  tags: text("tags").array(),
});

// Insert schemas
const baseInsertUserSchema = createInsertSchema(users);

export const insertUserSchema = z.object({
  id: baseInsertUserSchema.shape.id.optional(),
  username: baseInsertUserSchema.shape.username,
  password: baseInsertUserSchema.shape.password,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).omit({
  id: true,
  createdAt: true,
});

const workoutLogExerciseSchema = z
  .object({
    name: z.string().min(1, "Exercise name is required"),
    sets: z.number().int().positive().max(200).optional(),
    reps: z.number().int().positive().max(500).optional(),
    weightKg: z.number().nonnegative().max(500).optional(),
    durationMinutes: z.number().int().positive().max(600).optional(),
    durationSeconds: z.number().int().positive().max(3_600).optional(),
    notes: z.string().max(500).optional(),
    intensity: z.string().max(100).optional(),
  })
  .passthrough();

const workoutLogBaseSchema = z.object({
  workoutId: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return value;
    }, z.union([z.string().min(1, "Workout ID must be a non-empty string"), z.null()]))
    .optional(),
  completedAt: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      return value;
    }, z.coerce.date())
    .optional(),
  exercises: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      return value;
    }, z.union([z.array(workoutLogExerciseSchema).max(50, "Limit of 50 exercises per log"), z.null()]))
    .optional(),
  notes: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
      }
      return value;
    }, z.union([z.string().max(500, "Notes must be 500 characters or fewer"), z.null()]))
    .optional(),
  rating: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return value;
    }, z.union([z.coerce.number().int().min(1).max(5), z.null()]))
    .optional(),
  rpe: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return value;
    }, z.union([z.coerce.number().int().min(1).max(10), z.null()]))
    .optional(),
  durationMinutes: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return value;
    }, z.union([z.coerce.number().int().min(1).max(600), z.null()]))
    .optional(),
  caloriesBurned: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return value;
    }, z.union([z.coerce.number().int().min(0).max(5000), z.null()]))
    .optional(),
  tags: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      return value;
    },
    z.union([
      z
        .array(
          z
            .string()
            .trim()
            .min(1, "Tags must be at least 1 character")
            .max(30, "Tags must be 30 characters or fewer"),
        )
        .max(8, "Limit of 8 tags per workout log"),
      z.null(),
    ]))
    .optional(),
});

export const insertWorkoutLogSchema = workoutLogBaseSchema
  .extend({
    userId: z.string().min(1, "User ID is required"),
  })
  .superRefine((data, ctx) => {
    const exerciseCount = Array.isArray(data.exercises) ? data.exercises.length : 0;
    if (!data.workoutId && exerciseCount === 0) {
      ctx.addIssue({
        path: ["exercises"],
        code: z.ZodIssueCode.custom,
        message: "Provide at least one exercise when logging a custom workout.",
      });
    }
  });

export const updateWorkoutLogSchema = workoutLogBaseSchema.superRefine((data, ctx) => {
  if (data.workoutId === null && data.exercises !== undefined) {
    const exerciseCount = Array.isArray(data.exercises) ? data.exercises.length : 0;
    if (exerciseCount === 0) {
      ctx.addIssue({
        path: ["exercises"],
        code: z.ZodIssueCode.custom,
        message: "Custom workout logs must include at least one exercise.",
      });
    }
  }
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type WorkoutLogExercise = z.infer<typeof workoutLogExerciseSchema>;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type UpdateWorkoutLog = z.infer<typeof updateWorkoutLogSchema>;

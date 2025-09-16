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
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export const insertWorkoutPlanSchema = createInsertSchema(workoutPlans).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({
  id: true,
  completedAt: true,
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
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

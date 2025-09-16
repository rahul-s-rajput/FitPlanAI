import {
  users,
  equipment as equipmentTable,
  workoutPlans as workoutPlansTable,
  workouts as workoutsTable,
  workoutLogs as workoutLogsTable,
  type User,
  type InsertUser,
  type Equipment,
  type InsertEquipment,
  type WorkoutPlan,
  type InsertWorkoutPlan,
  type Workout,
  type WorkoutLog,
  type InsertWorkoutLog,
} from "@shared/schema";
import { and, desc, eq, gte, lte, asc } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Equipment
  getUserEquipment(userId: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;

  // Workout Plans
  getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
  getWorkoutPlan(id: string): Promise<WorkoutPlan | undefined>;
  createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan>;
  updateWorkoutPlan(id: string, updates: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan | undefined>;
  deleteWorkoutPlan(id: string): Promise<boolean>;

  // Workout Logs
  getUserWorkoutLogs(userId: string, limit?: number): Promise<WorkoutLog[]>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined>;
  deleteWorkoutLog(id: string): Promise<boolean>;
  getWorkoutLogsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]>;

  // Workouts (individual workouts from plans)
  getWorkout(id: string): Promise<Workout | undefined>;
  getPlanWorkouts(planId: string): Promise<Workout[]>;
  createWorkout(workout: {
    planId: string;
    name: string;
    exercises: any;
    estimatedDuration?: number;
    dayOfWeek?: number;
  }): Promise<Workout>;
  updateWorkout(
    id: string,
    updates: Partial<{
      name: string;
      exercises: any;
      estimatedDuration?: number;
      dayOfWeek?: number;
    }>,
  ): Promise<Workout | undefined>;
  deleteWorkout(id: string): Promise<boolean>;
}

function applyDefinedFields<T extends Record<string, unknown>>(updates: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Equipment
  async getUserEquipment(userId: string): Promise<Equipment[]> {
    return db
      .select()
      .from(equipmentTable)
      .where(eq(equipmentTable.userId, userId))
      .orderBy(asc(equipmentTable.name));
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const [created] = await db.insert(equipmentTable).values(equipment).returning();
    return created;
  }

  async updateEquipment(
    id: string,
    updates: Partial<InsertEquipment>,
  ): Promise<Equipment | undefined> {
    const [existing] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, id));
    if (!existing) {
      return undefined;
    }

    const sanitized = applyDefinedFields<InsertEquipment>(updates);
    delete sanitized.userId;
    if (Object.keys(sanitized).length === 0) {
      return existing;
    }

    const [updated] = await db
      .update(equipmentTable)
      .set(sanitized)
      .where(eq(equipmentTable.id, id))
      .returning();

    return updated ?? existing;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const deleted = await db.delete(equipmentTable).where(eq(equipmentTable.id, id)).returning({ id: equipmentTable.id });
    return deleted.length > 0;
  }

  // Workout Plans
  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return db
      .select()
      .from(workoutPlansTable)
      .where(eq(workoutPlansTable.userId, userId))
      .orderBy(desc(workoutPlansTable.createdAt), desc(workoutPlansTable.id));
  }

  async getWorkoutPlan(id: string): Promise<WorkoutPlan | undefined> {
    const [plan] = await db.select().from(workoutPlansTable).where(eq(workoutPlansTable.id, id));
    return plan;
  }

  async createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    const [created] = await db.insert(workoutPlansTable).values(plan).returning();
    return created;
  }

  async updateWorkoutPlan(
    id: string,
    updates: Partial<InsertWorkoutPlan>,
  ): Promise<WorkoutPlan | undefined> {
    const [existing] = await db.select().from(workoutPlansTable).where(eq(workoutPlansTable.id, id));
    if (!existing) {
      return undefined;
    }

    const sanitized = applyDefinedFields<InsertWorkoutPlan>(updates);
    delete sanitized.userId;
    if (Object.keys(sanitized).length === 0) {
      return existing;
    }

    const [updated] = await db
      .update(workoutPlansTable)
      .set(sanitized)
      .where(eq(workoutPlansTable.id, id))
      .returning();

    return updated ?? existing;
  }

  async deleteWorkoutPlan(id: string): Promise<boolean> {
    const deleted = await db
      .delete(workoutPlansTable)
      .where(eq(workoutPlansTable.id, id))
      .returning({ id: workoutPlansTable.id });
    return deleted.length > 0;
  }

  // Workout Logs
  async getUserWorkoutLogs(userId: string, limit = 50): Promise<WorkoutLog[]> {
    return db
      .select()
      .from(workoutLogsTable)
      .where(eq(workoutLogsTable.userId, userId))
      .orderBy(desc(workoutLogsTable.completedAt), desc(workoutLogsTable.id))
      .limit(limit);
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [created] = await db.insert(workoutLogsTable).values(log).returning();
    return created;
  }

  async updateWorkoutLog(
    id: string,
    updates: Partial<InsertWorkoutLog>,
  ): Promise<WorkoutLog | undefined> {
    const [existing] = await db.select().from(workoutLogsTable).where(eq(workoutLogsTable.id, id));
    if (!existing) {
      return undefined;
    }

    const sanitized = applyDefinedFields<InsertWorkoutLog>(updates);
    delete sanitized.userId;
    if (Object.keys(sanitized).length === 0) {
      return existing;
    }

    const [updated] = await db
      .update(workoutLogsTable)
      .set(sanitized)
      .where(eq(workoutLogsTable.id, id))
      .returning();

    return updated ?? existing;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const deleted = await db
      .delete(workoutLogsTable)
      .where(eq(workoutLogsTable.id, id))
      .returning({ id: workoutLogsTable.id });
    return deleted.length > 0;
  }

  async getWorkoutLogsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WorkoutLog[]> {
    return db
      .select()
      .from(workoutLogsTable)
      .where(
        and(
          eq(workoutLogsTable.userId, userId),
          gte(workoutLogsTable.completedAt, startDate),
          lte(workoutLogsTable.completedAt, endDate),
        ),
      )
      .orderBy(asc(workoutLogsTable.completedAt), asc(workoutLogsTable.id));
  }

  // Workouts
  async getWorkout(id: string): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workoutsTable).where(eq(workoutsTable.id, id));
    return workout;
  }

  async getPlanWorkouts(planId: string): Promise<Workout[]> {
    return db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.planId, planId))
      .orderBy(asc(workoutsTable.dayOfWeek), asc(workoutsTable.name));
  }

  async createWorkout(
    workout: {
      planId: string;
      name: string;
      exercises: any;
      estimatedDuration?: number;
      dayOfWeek?: number;
    },
  ): Promise<Workout> {
    const [created] = await db
      .insert(workoutsTable)
      .values({
        planId: workout.planId,
        name: workout.name,
        exercises: workout.exercises,
        estimatedDuration: workout.estimatedDuration,
        dayOfWeek: workout.dayOfWeek,
      })
      .returning();

    return created;
  }

  async updateWorkout(
    id: string,
    updates: Partial<{
      name: string;
      exercises: any;
      estimatedDuration?: number;
      dayOfWeek?: number;
    }>,
  ): Promise<Workout | undefined> {
    const [existing] = await db.select().from(workoutsTable).where(eq(workoutsTable.id, id));
    if (!existing) {
      return undefined;
    }

    const sanitized = applyDefinedFields(updates);
    if (Object.keys(sanitized).length === 0) {
      return existing;
    }

    const [updated] = await db
      .update(workoutsTable)
      .set(sanitized)
      .where(eq(workoutsTable.id, id))
      .returning();

    return updated ?? existing;
  }

  async deleteWorkout(id: string): Promise<boolean> {
    const deleted = await db
      .delete(workoutsTable)
      .where(eq(workoutsTable.id, id))
      .returning({ id: workoutsTable.id });
    return deleted.length > 0;
  }
}

export const storage: IStorage = new DrizzleStorage();

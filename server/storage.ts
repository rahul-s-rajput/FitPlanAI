import { 
  type User, type InsertUser, type Equipment, type InsertEquipment,
  type WorkoutPlan, type InsertWorkoutPlan, type Workout, 
  type WorkoutLog, type InsertWorkoutLog 
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  createWorkout(workout: { planId: string; name: string; exercises: any; estimatedDuration?: number; dayOfWeek?: number }): Promise<Workout>;
  updateWorkout(id: string, updates: Partial<{ name: string; exercises: any; estimatedDuration?: number; dayOfWeek?: number }>): Promise<Workout | undefined>;
  deleteWorkout(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private equipment: Map<string, Equipment>;
  private workoutPlans: Map<string, WorkoutPlan>;
  private workouts: Map<string, Workout>;
  private workoutLogs: Map<string, WorkoutLog>;

  constructor() {
    this.users = new Map();
    this.equipment = new Map();
    this.workoutPlans = new Map();
    this.workouts = new Map();
    this.workoutLogs = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Equipment
  async getUserEquipment(userId: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(eq => eq.userId === userId);
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const id = randomUUID();
    const newEquipment: Equipment = {
      id,
      userId: equipment.userId,
      name: equipment.name,
      type: equipment.type,
      weight: equipment.weight ?? null,
      quantity: equipment.quantity ?? 1,
    };
    this.equipment.set(id, newEquipment);
    return newEquipment;
  }

  async updateEquipment(id: string, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const existing = this.equipment.get(id);
    if (!existing) return undefined;
    
    const updated: Equipment = {
      ...existing,
      name: updates.name ?? existing.name,
      type: updates.type ?? existing.type,
      weight: updates.weight ?? existing.weight,
      quantity: updates.quantity ?? existing.quantity,
    };
    this.equipment.set(id, updated);
    return updated;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    return this.equipment.delete(id);
  }

  // Workout Plans
  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return Array.from(this.workoutPlans.values()).filter(plan => plan.userId === userId);
  }

  async getWorkoutPlan(id: string): Promise<WorkoutPlan | undefined> {
    return this.workoutPlans.get(id);
  }

  async createWorkoutPlan(plan: InsertWorkoutPlan): Promise<WorkoutPlan> {
    const id = randomUUID();
    const newPlan: WorkoutPlan = {
      id,
      userId: plan.userId,
      name: plan.name,
      description: plan.description ?? null,
      goals: plan.goals ?? null,
      restrictions: plan.restrictions ?? null,
      weeklyMinutes: plan.weeklyMinutes,
      dailyMinutes: plan.dailyMinutes,
      createdAt: new Date(),
    };
    this.workoutPlans.set(id, newPlan);
    return newPlan;
  }

  async updateWorkoutPlan(id: string, updates: Partial<InsertWorkoutPlan>): Promise<WorkoutPlan | undefined> {
    const existing = this.workoutPlans.get(id);
    if (!existing) return undefined;
    
    const updated: WorkoutPlan = {
      ...existing,
      name: updates.name ?? existing.name,
      description: updates.description ?? existing.description,
      goals: updates.goals ?? existing.goals,
      restrictions: updates.restrictions ?? existing.restrictions,
      weeklyMinutes: updates.weeklyMinutes ?? existing.weeklyMinutes,
      dailyMinutes: updates.dailyMinutes ?? existing.dailyMinutes,
    };
    this.workoutPlans.set(id, updated);
    return updated;
  }

  async deleteWorkoutPlan(id: string): Promise<boolean> {
    return this.workoutPlans.delete(id);
  }

  // Workout Logs
  async getUserWorkoutLogs(userId: string, limit = 50): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = randomUUID();
    const newLog: WorkoutLog = {
      id,
      userId: log.userId,
      workoutId: log.workoutId ?? null,
      completedAt: new Date(),
      exercises: log.exercises ?? null,
      notes: log.notes ?? null,
      rating: log.rating ?? null,
    };
    this.workoutLogs.set(id, newLog);
    return newLog;
  }

  async updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const existing = this.workoutLogs.get(id);
    if (!existing) return undefined;
    
    const updated: WorkoutLog = {
      ...existing,
      workoutId: updates.workoutId ?? existing.workoutId,
      exercises: updates.exercises ?? existing.exercises,
      notes: updates.notes ?? existing.notes,
      rating: updates.rating ?? existing.rating,
    };
    this.workoutLogs.set(id, updated);
    return updated;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    return this.workoutLogs.delete(id);
  }

  async getWorkoutLogsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => {
        if (log.userId !== userId) return false;
        const logDate = new Date(log.completedAt!);
        return logDate >= startDate && logDate <= endDate;
      })
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
  }
  
  // Workouts (individual workouts from plans)
  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getPlanWorkouts(planId: string): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(workout => workout.planId === planId);
  }

  async createWorkout(workoutData: { planId: string; name: string; exercises: any; estimatedDuration?: number; dayOfWeek?: number }): Promise<Workout> {
    const id = randomUUID();
    const newWorkout: Workout = {
      id,
      planId: workoutData.planId,
      name: workoutData.name,
      exercises: workoutData.exercises,
      estimatedDuration: workoutData.estimatedDuration ?? null,
      dayOfWeek: workoutData.dayOfWeek ?? null,
    };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  async updateWorkout(id: string, updates: Partial<{ name: string; exercises: any; estimatedDuration?: number; dayOfWeek?: number }>): Promise<Workout | undefined> {
    const existing = this.workouts.get(id);
    if (!existing) return undefined;
    
    const updated: Workout = {
      ...existing,
      name: updates.name ?? existing.name,
      exercises: updates.exercises ?? existing.exercises,
      estimatedDuration: updates.estimatedDuration ?? existing.estimatedDuration,
      dayOfWeek: updates.dayOfWeek ?? existing.dayOfWeek,
    };
    this.workouts.set(id, updated);
    return updated;
  }

  async deleteWorkout(id: string): Promise<boolean> {
    return this.workouts.delete(id);
  }
}

export const storage = new MemStorage();

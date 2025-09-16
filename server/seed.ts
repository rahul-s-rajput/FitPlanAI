import { db } from "./db";
import {
  equipment as equipmentTable,
  workoutPlans as workoutPlansTable,
  workouts as workoutsTable,
  workoutLogs as workoutLogsTable,
  users,
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

const DEMO_USER = {
  id: "demo-user",
  username: "demo-user",
  password: "demo-user-password",
};

interface SeedSummary {
  equipmentCount: number;
  planCount: number;
  workoutCount: number;
  logCount: number;
}

async function seedDemoData(): Promise<SeedSummary> {
  const summary: SeedSummary = {
    equipmentCount: 0,
    planCount: 0,
    workoutCount: 0,
    logCount: 0,
  };

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values(DEMO_USER)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: DEMO_USER.username,
          password: DEMO_USER.password,
        },
      });

    await tx.delete(workoutLogsTable).where(eq(workoutLogsTable.userId, DEMO_USER.id));

    const existingPlanIds = await tx
      .select({ id: workoutPlansTable.id })
      .from(workoutPlansTable)
      .where(eq(workoutPlansTable.userId, DEMO_USER.id));
    const planIds = existingPlanIds.map((plan) => plan.id);

    if (planIds.length > 0) {
      await tx.delete(workoutsTable).where(inArray(workoutsTable.planId, planIds));
    }

    await tx.delete(workoutPlansTable).where(eq(workoutPlansTable.userId, DEMO_USER.id));
    await tx.delete(equipmentTable).where(eq(equipmentTable.userId, DEMO_USER.id));

    const equipmentSeed = [
      {
        userId: DEMO_USER.id,
        type: "dumbbell",
        name: "Adjustable Dumbbell",
        weight: 10,
        quantity: 2,
      },
      {
        userId: DEMO_USER.id,
        type: "resistance_band",
        name: "Resistance Band Set",
        quantity: 5,
      },
      {
        userId: DEMO_USER.id,
        type: "mat",
        name: "Yoga Mat",
        quantity: 1,
      },
    ];

    const equipmentRows = await tx
      .insert(equipmentTable)
      .values(equipmentSeed)
      .returning({ id: equipmentTable.id });
    summary.equipmentCount = equipmentRows.length;

    const planId = "demo-plan-strong-at-home";

    const planRow = await tx
      .insert(workoutPlansTable)
      .values({
        id: planId,
        userId: DEMO_USER.id,
        name: "Strong at Home 4-Week Kickoff",
        description:
          "Four-day minimal-equipment plan balancing strength, conditioning, and recovery while fitting into small spaces.",
        goals: ["strength", "mobility", "endurance"],
        restrictions: { space: "limited", noise: "low_noise", outdoor: false },
        weeklyMinutes: 150,
        dailyMinutes: 30,
        nutritionalGuidance:
          "Aim for 1.6g/kg protein anchored by whole foods, include colourful vegetables daily, hydrate with 2.5L water, and refuel within 60 minutes of training with 30g protein plus complex carbs.",
        aiMetadata: {
          provider: "openrouter",
          model: "openai/gpt-oss-120b:free",
          requestId: "seeded-demo-plan",
          createdAt: new Date().toISOString(),
          usage: {
            promptTokens: 640,
            completionTokens: 910,
            totalTokens: 1550,
          },
        },
      })
      .returning({ id: workoutPlansTable.id });

    summary.planCount = planRow.length;

    const workoutsSeed = [
      {
        id: "demo-workout-strong-at-home-1",
        planId,
        name: "Lower Body & Core Foundations",
        estimatedDuration: 32,
        dayOfWeek: 1,
        exercises: [
          {
            name: "Dynamic Warm-Up",
            duration: 5,
            instructions: "March in place, leg swings, and hip circles to prime the joints.",
          },
          {
            name: "Goblet Squat",
            sets: 3,
            reps: 12,
            equipment: "10kg adjustable dumbbell",
            instructions: "Hold the dumbbell at chest height, control a 3-1 tempo, and drive knees out.",
          },
          {
            name: "Split Squat",
            sets: 3,
            reps: 10,
            equipment: "Bodyweight or light dumbbell assist",
            instructions: "Keep torso tall and push through the front heel with active glute engagement.",
          },
          {
            name: "Resistance Band Deadlift",
            sets: 3,
            reps: 15,
            equipment: "Heavy resistance band",
            instructions: "Stand on the band, hinge from the hips, and squeeze glutes at the top.",
          },
          {
            name: "Plank with Shoulder Tap",
            sets: 3,
            duration: 45,
            instructions: "Alternate taps while keeping hips level and core braced.",
          },
        ],
      },
      {
        id: "demo-workout-strong-at-home-2",
        planId,
        name: "Push & Pull Strength Circuit",
        estimatedDuration: 28,
        dayOfWeek: 3,
        exercises: [
          {
            name: "Band Shoulder Series",
            duration: 4,
            instructions: "Perform pull-aparts, face pulls, and shoulder dislocates for activation.",
          },
          {
            name: "Single-Arm Dumbbell Row",
            sets: 3,
            reps: 12,
            equipment: "10kg adjustable dumbbell",
            instructions: "Brace on a bench or chair, drive elbow toward the hip, and pause at the top.",
          },
          {
            name: "Resistance Band Chest Press",
            sets: 3,
            reps: 15,
            equipment: "Medium resistance band",
            instructions: "Anchor the band at chest height and press forward with controlled tempo.",
          },
          {
            name: "Half-Kneeling Shoulder Press",
            sets: 3,
            reps: 10,
            equipment: "10kg adjustable dumbbell",
            instructions: "Squeeze the rear glute, keep ribs stacked, and press overhead smoothly.",
          },
          {
            name: "Hollow Body Hold",
            sets: 3,
            duration: 40,
            instructions: "Maintain ribs down, low back pressed to the mat, and breathe steadily.",
          },
        ],
      },
      {
        id: "demo-workout-strong-at-home-3",
        planId,
        name: "Conditioning & Mobility Flow",
        estimatedDuration: 26,
        dayOfWeek: 5,
        exercises: [
          {
            name: "Jump Rope or Band Skips",
            duration: 4,
            instructions: "Light bounce on the balls of the feet to elevate heart rate without noise.",
          },
          {
            name: "Resistance Band Good Morning",
            sets: 3,
            reps: 15,
            equipment: "Light resistance band",
            instructions: "Hinge from the hips with neutral spine and snap to standing.",
          },
          {
            name: "Reverse Lunge to Knee Drive",
            sets: 3,
            reps: 12,
            equipment: "Bodyweight",
            instructions: "Step back quietly, drive the knee tall, and use opposite arm swing.",
          },
          {
            name: "Bear Crawl Hold with Shoulder Tap",
            sets: 3,
            duration: 45,
            instructions: "Hover knees two inches off the mat and tap opposite shoulders without swaying.",
          },
          {
            name: "Yoga Flow Cooldown",
            duration: 5,
            instructions: "Cycle through cat-cow, world's greatest stretch, and child's pose breathing.",
          },
        ],
      },
    ];

    const workoutRows = await tx
      .insert(workoutsTable)
      .values(workoutsSeed)
      .returning({ id: workoutsTable.id });

    summary.workoutCount = workoutRows.length;

    const now = new Date();
    const logSeeds = [
      {
        id: "demo-log-strong-at-home-1",
        userId: DEMO_USER.id,
        workoutId: workoutsSeed[0].id,
        completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 30),
        exercises: [
          { name: "Goblet Squat", sets: 3, reps: 12, weightKg: 10 },
          { name: "Split Squat", sets: 3, reps: 10 },
          { name: "Resistance Band Deadlift", sets: 3, reps: 15, band: "heavy" },
        ],
        notes: "Focused on slow eccentrics; lunges were challenging but form stayed tight.",
        rating: 4,
        rpe: 7,
        durationMinutes: 38,
        caloriesBurned: 320,
        tags: ["strength", "lower-body"],
      },
      {
        id: "demo-log-strong-at-home-2",
        userId: DEMO_USER.id,
        workoutId: workoutsSeed[1].id,
        completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 7, 45),
        exercises: [
          { name: "Single-Arm Dumbbell Row", sets: 3, reps: 12, weightKg: 10 },
          { name: "Band Chest Press", sets: 3, reps: 15, band: "medium" },
          { name: "Half-Kneeling Shoulder Press", sets: 3, reps: 10, weightKg: 10 },
        ],
        notes: "Strong lockout on presses; shoulder felt stable throughout.",
        rating: 5,
        rpe: 8,
        durationMinutes: 34,
        caloriesBurned: 285,
        tags: ["strength", "upper-body"],
      },
      {
        id: "demo-log-strong-at-home-3",
        userId: DEMO_USER.id,
        workoutId: workoutsSeed[2].id,
        completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 19, 15),
        exercises: [
          { name: "Band Good Morning", sets: 3, reps: 15 },
          { name: "Reverse Lunge to Knee Drive", sets: 3, reps: 12 },
          { name: "Bear Crawl Hold", sets: 3, durationSeconds: 45 },
        ],
        notes: "Conditioning flow elevated heart rate; added extra mobility between rounds.",
        rating: 3,
        rpe: 6,
        durationMinutes: 31,
        caloriesBurned: 260,
        tags: ["conditioning", "mobility"],
      },
      {
        id: "demo-log-strong-at-home-recovery",
        userId: DEMO_USER.id,
        workoutId: null,
        completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 12, 15),
        exercises: [
          { name: "Outdoor Recovery Walk", durationMinutes: 25, intensity: "zone 2" },
        ],
        notes: "Used as active recovery between strength days.",
        rating: 4,
        rpe: 3,
        durationMinutes: 25,
        caloriesBurned: 150,
        tags: ["recovery", "cardio"],
      },
    ];

    const logRows = await tx
      .insert(workoutLogsTable)
      .values(logSeeds)
      .returning({ id: workoutLogsTable.id });

    summary.logCount = logRows.length;
  });

  return summary;
}

seedDemoData()
  .then((summary) => {
    console.log(
      `Seeded demo data for ${DEMO_USER.username}: ${summary.planCount} plan, ${summary.workoutCount} workouts, ${summary.equipmentCount} equipment items, ${summary.logCount} logs.`,
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  });

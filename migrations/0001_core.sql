CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "equipment" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "name" text NOT NULL,
  "weight" integer,
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "workout_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "goals" text[],
  "restrictions" jsonb,
  "weekly_minutes" integer NOT NULL,
  "daily_minutes" integer NOT NULL,
  "nutritional_guidance" text,
  "ai_metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "workouts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan_id" varchar NOT NULL REFERENCES "workout_plans"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "exercises" jsonb,
  "estimated_duration" integer,
  "day_of_week" integer
);

CREATE TABLE IF NOT EXISTS "workout_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workout_id" varchar REFERENCES "workouts"("id") ON DELETE SET NULL,
  "completed_at" timestamp DEFAULT now(),
  "exercises" jsonb,
  "notes" text,
  "rating" integer
);

CREATE INDEX IF NOT EXISTS "equipment_user_id_idx" ON "equipment" ("user_id");
CREATE INDEX IF NOT EXISTS "workout_plans_user_id_idx" ON "workout_plans" ("user_id");
CREATE INDEX IF NOT EXISTS "workouts_plan_id_idx" ON "workouts" ("plan_id");
CREATE INDEX IF NOT EXISTS "workout_logs_user_id_completed_at_idx" ON "workout_logs" ("user_id", "completed_at");

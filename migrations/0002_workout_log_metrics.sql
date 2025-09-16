ALTER TABLE "workout_logs"
  ADD COLUMN IF NOT EXISTS "rpe" integer,
  ADD COLUMN IF NOT EXISTS "duration_minutes" integer,
  ADD COLUMN IF NOT EXISTS "calories_burned" integer,
  ADD COLUMN IF NOT EXISTS "tags" text[];

CREATE INDEX IF NOT EXISTS "workout_logs_rpe_idx" ON "workout_logs" ("rpe");
CREATE INDEX IF NOT EXISTS "workout_logs_duration_idx" ON "workout_logs" ("duration_minutes");

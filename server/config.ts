
import { z, type ZodIssue } from "zod";

const envObjectSchema = z

  .object({
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL environment variable is required"),
    OPENROUTER_API_KEY: z
      .string()
      .min(1, "OPENROUTER_API_KEY environment variable is required"),
    OPENROUTER_MODEL: z.string().optional(),
    OPENROUTER_SITE_URL: z.string().url().optional(),
    OPENROUTER_APP_TITLE: z.string().optional(),
    OPENROUTER_BASE_URL: z.string().url().optional(),
    OPENROUTER_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),

    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  })
  .passthrough();

const envSchema = envObjectSchema.superRefine((data, ctx) => {
  const supabaseValues = [
    data.SUPABASE_URL,
    data.SUPABASE_ANON_KEY,
    data.SUPABASE_SERVICE_ROLE_KEY,
  ];
  const hasAnySupabaseConfig = supabaseValues.some((value) => value && value.length > 0);
  const hasAllSupabaseConfig = supabaseValues.every((value) => value && value.length > 0);

  if (hasAnySupabaseConfig && !hasAllSupabaseConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must all be defined when configuring Supabase",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessages = parsed.error.issues
    .map((issue: ZodIssue) => issue.message)
    .join(", ");

  throw new Error(`Invalid environment configuration: ${errorMessages}`);
}

export const config = {
  database: {
    url: parsed.data.DATABASE_URL,
  },
  openRouter: {
    apiKey: parsed.data.OPENROUTER_API_KEY,
    model: parsed.data.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free",
    siteUrl: parsed.data.OPENROUTER_SITE_URL,
    appTitle: parsed.data.OPENROUTER_APP_TITLE ?? "FitPlanAI",
    baseUrl: parsed.data.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    requestTimeoutMs: parsed.data.OPENROUTER_TIMEOUT_MS ?? 60_000,
  },

  supabase: parsed.data.SUPABASE_URL
    ? {
        url: parsed.data.SUPABASE_URL,
        anonKey: parsed.data.SUPABASE_ANON_KEY!,
        serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY!,
      }
    : undefined,

};

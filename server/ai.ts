import type { Equipment } from "@shared/schema";
import { z } from "zod";
import { config } from "./config";

const {
  apiKey: OPENROUTER_API_KEY,
  model: DEFAULT_MODEL,
  siteUrl: DEFAULT_SITE_URL,
  appTitle: DEFAULT_APP_TITLE,
  baseUrl: OPENROUTER_BASE_URL,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
} = config.openRouter;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is required");
}

export class AIServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number }) {
    super(message);
    this.name = "AIServiceError";
    this.status = options?.status ?? 500;
  }
}

interface WorkoutPlanRequest {
  equipment: Equipment[];
  goals: string[];
  restrictions: {
    space: string;
    noise: string;
    outdoor: boolean;
  };
  weeklyMinutes: number;
  dailyMinutes: number;
}

interface OpenRouterChatResponse {
  choices: Array<{
    message: {
      content?: string;
    };
  }>;
}

const exerciseSchema = z
  .object({
    name: z.string().min(1),
    sets: z.number().int().positive().max(200).optional(),
    reps: z.number().int().positive().max(500).optional(),
    duration: z.number().int().positive().max(3_600).optional(),
    equipment: z.string().min(1).optional(),
    instructions: z.string().min(1),
  })
  .passthrough();

const workoutSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    exercises: z.array(exerciseSchema).min(1),
    estimatedDuration: z.number().int().positive().max(240),
    dayOfWeek: z.number().int().min(0).max(6),
  })
  .passthrough();

const workoutPlanSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    workouts: z.array(workoutSchema).min(1),
    nutritionalGuidance: z.string().min(1),
  })
  .passthrough();

type WorkoutPlanResponse = z.infer<typeof workoutPlanSchema>;

function formatEquipmentList(equipment: Equipment[]): string {
  if (!equipment.length) {
    return "Bodyweight only";
  }

  return equipment
    .map((eq) => {
      const qualifiers: string[] = [];

      if (eq.type && eq.type !== eq.name) {
        qualifiers.push(eq.type);
      }
      if (typeof eq.weight === "number") {
        qualifiers.push(`${eq.weight}kg`);
      }
      if (eq.quantity && eq.quantity > 1) {
        qualifiers.push(`x${eq.quantity}`);
      }

      if (qualifiers.length === 0) {
        return eq.name;
      }

      return `${eq.name} (${qualifiers.join(", ")})`;
    })
    .join(", ");
}

function formatRestrictions(
  restrictions: WorkoutPlanRequest["restrictions"],
): string {
  const items: string[] = [];

  if (restrictions.space === "limited") {
    items.push("limited space");
  } else if (restrictions.space) {
    items.push(`${restrictions.space} space available`);
  }

  if (restrictions.noise === "no_noise") {
    items.push("no noise (quiet exercises only)");
  } else if (restrictions.noise === "low_noise") {
    items.push("low noise preferred");
  } else if (restrictions.noise) {
    items.push("noise level not restricted");
  }

  items.push(
    restrictions.outdoor ? "outdoor activities allowed" : "indoor only",
  );

  return items.join(", ");
}

async function callOpenRouter<T>(body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  };

  if (DEFAULT_SITE_URL) {
    headers["HTTP-Referer"] = DEFAULT_SITE_URL;
  }

  if (DEFAULT_APP_TITLE) {
    headers["X-Title"] = DEFAULT_APP_TITLE;
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorDetail: string | undefined;

      try {
        const errorJson = await response.json();
        errorDetail =
          errorJson?.error?.message ??
          (typeof errorJson === "string"
            ? errorJson
            : JSON.stringify(errorJson));
      } catch {
        errorDetail = await response.text();
      }

      const status = response.status;

      if (status === 401 || status === 403) {
        throw new AIServiceError(
          "OpenRouter API key is invalid or unauthorized",
          { status: 401 },
        );
      }

      if (status === 429) {
        throw new AIServiceError(
          "AI service rate limit reached. Please try again shortly.",
          { status: 429 },
        );
      }

      if (status >= 500) {
        throw new AIServiceError(
          "AI service is temporarily unavailable. Please try again later.",
          { status: 503 },
        );
      }

      const detailSuffix = errorDetail ? `: ${errorDetail}` : "";
      throw new AIServiceError(
        `OpenRouter request failed (${status})${detailSuffix}`,
        { status: 502 },
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AIServiceError("AI service request timed out", { status: 504 });
    }

    console.error("Unexpected error calling OpenRouter:", error);
    throw new AIServiceError(
      "Failed to communicate with AI service.",
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function generateWorkoutPlan(
  request: WorkoutPlanRequest,
): Promise<WorkoutPlanResponse> {
  if (!request.goals || request.goals.length === 0) {
    throw new AIServiceError("At least one fitness goal is required", {
      status: 400,
    });
  }

  if (request.weeklyMinutes <= 0 || request.dailyMinutes <= 0) {
    throw new AIServiceError(
      "Weekly and daily minutes must be greater than 0",
      { status: 400 },
    );
  }

  const workoutsPerWeek = Math.max(
    1,
    Math.ceil(request.weeklyMinutes / request.dailyMinutes),
  );

  const prompt = `Create a personalized fitness workout plan based on the following criteria:

**Available Equipment:** ${formatEquipmentList(request.equipment)}
**Fitness Goals:** ${request.goals.join(", ")}
**Restrictions:** ${formatRestrictions(request.restrictions)}
**Time Commitment:** ${request.dailyMinutes} minutes per day, ${request.weeklyMinutes} minutes per week
**Workout Days:** ${workoutsPerWeek} days per week

Please generate a complete workout plan with:
1. Overall plan name and description
2. ${workoutsPerWeek} specific workouts (one for each training day)
3. Each workout should include exercises with sets, reps, or duration that respect the available equipment
4. All exercises must be scientifically sound, emphasize progressive overload, and respect the user's constraints
5. Include basic nutritional guidance aligned with the fitness goals, emphasising recovery and sustainable habits
6. Ensure total estimated duration per workout remains within ${request.dailyMinutes} minutes

Respond in JSON format with this structure:
{
  "name": "Plan name",
  "description": "Brief plan description",
  "workouts": [
    {
      "name": "Workout name",
      "description": "Workout description",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": 12,
          "duration": 60,
          "equipment": "equipment used",
          "instructions": "How to perform the exercise safely"
        }
      ],
      "estimatedDuration": 30,
      "dayOfWeek": 0
    }
  ],
  "nutritionalGuidance": "Dietary recommendations for the goals"
}`;

  try {
    const response = await callOpenRouter<OpenRouterChatResponse>({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a certified personal trainer and nutritionist with expertise in exercise science. Create safe, effective workout plans based on available equipment and user constraints. Always prioritise proper form, progressive overload, and adequate recovery.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new AIServiceError("No content received from AI service", {
        status: 502,
      });
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", parseError);
      throw new AIServiceError("Invalid response format from AI service", {
        status: 502,
      });
    }

    const parsedPlan = workoutPlanSchema.safeParse(parsedContent);
    if (!parsedPlan.success) {
      console.error(
        "OpenRouter response failed validation:",
        parsedPlan.error.flatten(),
      );
      throw new AIServiceError(
        "AI service returned an incomplete workout plan",
        { status: 502 },
      );
    }

    return parsedPlan.data;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    console.error("Error generating workout plan:", error);

    throw new AIServiceError(
      "AI service is temporarily unavailable. Please try again later.",
      { status: 503 },
    );
  }
}

export async function generateNutritionalGuidance(
  goals: string[],
  restrictions?: string[],
): Promise<string> {
  const prompt = `Provide nutritional guidance for someone with these fitness goals: ${goals.join(", ")}.
  ${restrictions?.length ? `Dietary restrictions: ${restrictions.join(", ")}` : ""}

  Keep it concise but practical, focusing on:
  - Key macronutrient targets
  - Meal timing recommendations
  - Hydration guidelines
  - 2-3 specific food suggestions

  Limit response to 150 words maximum.`;

  try {
    const response = await callOpenRouter<OpenRouterChatResponse>({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a certified nutritionist. Provide evidence-based dietary advice.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AIServiceError("No content received from AI service", {
        status: 502,
      });
    }

    return content;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    console.error("Error generating nutritional guidance:", error);
    throw new AIServiceError(
      "AI service could not produce nutritional guidance.",
      { status: 503 },
    );
  }
}

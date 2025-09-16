import OpenAI from "openai";
import { Equipment, WorkoutPlan } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

interface GeneratedWorkout {
  name: string;
  description: string;
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
    duration?: number; // in seconds
    equipment?: string;
    instructions: string;
  }>;
  estimatedDuration: number;
  dayOfWeek: number;
}

export async function generateWorkoutPlan(request: WorkoutPlanRequest): Promise<{
  name: string;
  description: string;
  workouts: GeneratedWorkout[];
  nutritionalGuidance: string;
}> {
  const equipmentList = request.equipment.map(eq => 
    `${eq.name} (${eq.type}${eq.weight ? `, ${eq.weight}kg` : ''}${eq.quantity > 1 ? `, x${eq.quantity}` : ''})`
  ).join(', ');

  const restrictionsText = [
    request.restrictions.space === 'limited' ? 'limited space' : `${request.restrictions.space} space available`,
    request.restrictions.noise === 'no_noise' ? 'no noise (quiet exercises only)' : 
    request.restrictions.noise === 'low_noise' ? 'low noise preferred' : 'noise level not restricted',
    request.restrictions.outdoor ? 'outdoor activities allowed' : 'indoor only'
  ].join(', ');

  const prompt = `Create a personalized fitness workout plan based on the following criteria:

**Available Equipment:** ${equipmentList || 'Bodyweight only'}
**Fitness Goals:** ${request.goals.join(', ')}
**Restrictions:** ${restrictionsText}
**Time Commitment:** ${request.dailyMinutes} minutes per day, ${request.weeklyMinutes} minutes per week
**Workout Days:** ${Math.ceil(request.weeklyMinutes / request.dailyMinutes)} days per week

Please generate a complete workout plan with:
1. Overall plan name and description
2. ${Math.ceil(request.weeklyMinutes / request.dailyMinutes)} specific workouts (one for each day)
3. Each workout should include exercises with sets, reps, or duration
4. All exercises must be scientifically sound and appropriate for the available equipment
5. Consider progressive overload and proper rest periods
6. Include basic nutritional guidance aligned with the fitness goals

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
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a certified personal trainer and nutritionist with expertise in exercise science. Create safe, effective workout plans based on available equipment and user constraints. Always prioritize proper form and progressive overload principles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result;
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw new Error("Failed to generate workout plan. Please try again.");
  }
}

export async function generateNutritionalGuidance(goals: string[], restrictions?: string[]): Promise<string> {
  const prompt = `Provide nutritional guidance for someone with these fitness goals: ${goals.join(', ')}.
  ${restrictions?.length ? `Dietary restrictions: ${restrictions.join(', ')}` : ''}
  
  Keep it concise but practical, focusing on:
  - Key macronutrient targets
  - Meal timing recommendations
  - Hydration guidelines
  - 2-3 specific food suggestions
  
  Limit response to 150 words maximum.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system", 
          content: "You are a certified nutritionist. Provide evidence-based dietary advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Error generating nutritional guidance:", error);
    return "Focus on a balanced diet with adequate protein for muscle recovery, complex carbohydrates for energy, and healthy fats. Stay hydrated and eat within 30 minutes post-workout.";
  }
}
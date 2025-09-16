# Backend Integration Plan

This document outlines the roadmap for building out the FitPlanAI backend to support personalized fitness planning, logging, and analytics.

## 1. Core Platform Setup (In Progress)
- [x] Stand up Express server with routing scaffold.
- [x] Configure environment management (OpenRouter API key, optional referer/title metadata, database URLs, request timeouts).
- [ ] Harden request validation (Zod schemas for inputs, consistent error responses).
- [ ] Implement centralized logging with structured output.

## 2. AI Planning Service
- [x] Swap the current OpenAI helper to use OpenRouter models with configurable defaults.
- [ ] Add guardrails for AI plan generation:
  - [x] Validate AI responses against a strict schema and reject malformed output.
  - [x] Surface structured error codes/messages back through HTTP responses.
  - [ ] Capture usage metrics and retry/fallback telemetry.
- [ ] Support separate prompts for workout periodization vs. nutritional targets.

## 3. Data Persistence Layer
- [x] Replace in-memory storage with PostgreSQL via Drizzle ORM.
- [x] Implement migrations for equipment, workout plans, workouts, logs, and users.
- [x] Add seed scripts for demo data and integration testing.

## 4. Authentication & User Management
- [ ] Implement session-backed auth (passport-local or email magic link).
- [ ] Add middleware to resolve the active user for all API routes.
- [ ] Provide account creation and profile management endpoints.

## 5. Activity Logging & Analytics
- [ ] Expand workout log schema to track RPE, duration, calories, and tags.
- [ ] Build reporting endpoints for streaks, volume, and compliance metrics.
- [ ] Integrate habit streak engine (grace periods, catch-up logic).

## 6. Notifications & Integrations
- [ ] Add optional email/push reminders for upcoming workouts.
- [ ] Expose webhook endpoints for wearable integrations (Strava, Apple Health exports).
- [ ] Provide ICS calendar feed for scheduled workouts.

## 7. Testing & Tooling
- [ ] Establish unit/integration test harness (Vitest/Jest + Supertest).
- [ ] Add contract tests for AI schema output and fallback flows.
- [ ] Configure CI pipeline with linting, type-checking, and automated deployments.

---

### Immediate Next Steps
- [x] Persist nutritional guidance and AI metadata alongside generated workout plans so it can be revisited later.
- [x] Replace the in-memory storage for equipment and plans with Drizzle/PostgreSQL-backed repositories.
- [x] Add database seed scripts so the demo environment has starter equipment, workout plans, and logs.
- [x] Expand workout logging routes with stricter validation and connect them to the frontend activity tracker.

With the workout history now flowing from the database into the activity tracker, the next iteration can focus on deeper analytics (RPE, duration, calorie tracking) and exposing richer summaries across multiple weeks.

#### Seed utility
- Run `npm run db:seed` after migrations to reset the demo account with curated equipment, the Strong at Home plan, associated workouts, and a week of representative workout logs.

These steps will unlock end-to-end plan generation using the free OpenRouter models while keeping the path open for persistent storage and authentication in subsequent iterations.

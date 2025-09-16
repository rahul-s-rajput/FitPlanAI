# FitPlanAI

FitPlanAI is a personal fitness planner that pairs a modern React frontend with an Express API to help users catalog equipment, capture workout preferences, generate AI-assisted training plans with nutrition guidance, and log daily activity for progress insights.

## Project structure

The repository is a single Vite workspace that serves the client UI and API from the same Node process:

- `client/` – React components, pages, and UI utilities rendered by Vite.
- `server/` – Express entrypoint, REST route handlers, AI integrations, database access layer, and development seed script.
- `shared/` – Zod schemas and TypeScript types that are reused across the client and server.
- `migrations/` – Drizzle SQL migrations that define the PostgreSQL schema.

## Prerequisites

- **Node.js** 18 or newer.
- **npm** (ships with Node) for dependency management and scripts.
- **PostgreSQL** database and connection string (local server, Docker container, or a managed provider such as Supabase).
- **OpenRouter** API key for generating workout plans and nutrition guidance with free community models.

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the sample file and fill in the values that apply to your setup:

   ```bash
   cp .env.example .env
   ```

   - **`DATABASE_URL`** – points to the Postgres instance backing the app. When hosting on Supabase, open
     _Project Settings → Database_, copy the **Connection string** for pooled connections, and paste it into
     `.env`. Supabase URIs generally end with `?sslmode=require`; add the flag if it is missing so Drizzle can
     negotiate TLS.
   - **`OPENROUTER_API_KEY`** – generate a key at [openrouter.ai](https://openrouter.ai) for workout-plan generation.
   - **`SUPABASE_URL`**, **`SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_ROLE_KEY`** – optional but recommended when
     deploying on Supabase. Grab these from _Project Settings → API_ so the backend configuration matches your
     project’s API URL, client anon key, and server-only service role secret. Keep the service role key private; it
     is not required for local Postgres setups.

   The server validates the core environment values on startup, so ensure they are present before running scripts.

3. **Provision PostgreSQL**

   FitPlanAI connects to a standard PostgreSQL database through the Node `pg` driver. Pick whichever option fits your
   workflow and ensure the `DATABASE_URL` in your `.env` points at the running instance before running migrations:

   - **Use Supabase** – create a project at [supabase.com](https://supabase.com), open _Project Settings → Database_,
     and copy the _Connection string_ (URI) for pooled connections. Supabase enforces SSL, so the URI should already
     include `?sslmode=require`. Paste the value into your `.env` file as `DATABASE_URL`.
   - **Run Postgres locally** – if you have Docker installed, start a database with:

     ```bash
     docker run --name fitplanai-postgres \
       -e POSTGRES_USER=postgres \
       -e POSTGRES_PASSWORD=postgres \
       -e POSTGRES_DB=fitplanai \
       -p 5432:5432 \
       -d postgres:16
     ```

     On Windows without Docker, install PostgreSQL locally and create a `fitplanai` database manually.

   If `npm run db:push` reports `ECONNREFUSED`, double-check that the database server is running and accessible from your
   machine.

4. **Apply database migrations**

   ```bash
   npm run db:push
   ```

   This uses Drizzle Kit to sync the schema defined in `shared/schema.ts` with your configured database.

4. **Seed demo data (optional but recommended)**

   ```bash
   npm run db:seed
   ```

   The seed command provisions a demo user, sample equipment, a four-week Strong at Home plan (with workouts and nutritional guidance), and representative workout logs so you can explore the UI immediately.

## Running the app

- **Development**

  ```bash
  npm run dev
  ```

  The command boots the Express server in development mode, mounts the REST API under `/api`, and proxies the Vite-powered frontend. By default the app listens on `http://localhost:5000`; set the `PORT` environment variable to override the port.

- **Type checking**

  ```bash
  npm run check
  ```

- **Production build**

  ```bash
  npm run build
  ```

  After building, launch the bundled server with:

  ```bash
  npm run start
  ```

## Key features available today

- Equipment inventory CRUD for the demo user, including quantity and load tracking.
- Workout plan management with manual editing, deletion, and AI-assisted generation that stores nutrition guidance and OpenRouter metadata.
- Workout logging with RPE, duration, calorie tracking, streak calculations, and weekly summaries for the progress dashboard.
- Database-backed persistence via Drizzle ORM with seed data to explore the experience end-to-end.

## Additional resources

- `docs/backend-plan.md` – living roadmap for backend milestones and integration notes.
- `design_guidelines.md` – UI and UX guidelines for maintaining a consistent visual language.


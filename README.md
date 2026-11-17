# Project Tracker

A Next.js app for tracking projects and tasks with a Kanban board and workspace statistics.

## Features

- Project dashboard with task totals and project completion progress.
- Project creation and deletion, plus task creation, status changes, and deletion.
- Three-column Kanban board with optimistic task moves and confirmed deletes.
- Priority and title search filters, applied in SQL and reflected in the URL.
- Statistics for task status, priority, overdue tasks, and per-project completion.
- Zod validation for server-action form input.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Neon Postgres using `@neondatabase/serverless`
- Zod for validation

## Architecture

- App Router Server Components load dashboard, project, and statistics data at request time so database changes are not frozen into a build.
- `src/lib/queries.ts` contains parameterized SQL reads; `src/lib/db.ts` creates the server-only Neon client.
- `src/app/actions.ts` contains Server Actions for writes. They validate `FormData` with Zod, execute parameterized SQL, and revalidate affected routes.
- Client form and Kanban components use `useActionState` and `useOptimistic` for submission feedback and responsive task moves.
- `next.config.ts` applies security headers to all routes.

## Setup

1. Install Node.js (20.9 or later) and npm.
2. Create a Neon project and database. Copy its pooled Postgres connection string from the Neon dashboard.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file and add the connection string:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Edit `.env.local` and set `DATABASE_URL` to the Neon connection string, including its SSL options. Do not commit `.env.local`.

5. In the Neon SQL Editor, run [`db/schema.sql`](./db/schema.sql) once against the new database. It creates the `projects` and `tasks` tables and includes sample records.
6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

## Database schema

- `projects`: serial ID, required 2-80 character name, description, hex color, and creation timestamp.
- `tasks`: serial ID, project foreign key with cascading delete, required 2-140 character title, status (`todo`, `doing`, or `done`), priority (`low`, `medium`, or `high`), optional due date, and creation timestamp.

The schema also defines an index on `tasks.project_id` and check constraints for names, titles, status, and priority.

## Validation

```bash
npm run lint
npm run build
```
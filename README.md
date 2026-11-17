# Project Tracker

A Next.js app for tracking projects and tasks with a Kanban board and workspace statistics.

## Features

- Project dashboard with task totals and project completion progress.
- Project creation and deletion, plus task creation, status changes, and deletion.
- Three-column Kanban board with optimistic task moves and confirmed deletes.
- Priority and title search filters, applied in SQL and reflected in the URL.
- Statistics for task status, priority, overdue tasks, and per-project completion.
- Zod validation for server-action form input.
- GitHub OAuth sign-in using Auth.js v5 JWT sessions.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Neon Postgres using `@neondatabase/serverless`
- Zod for validation

## Architecture

- App Router Server Components load dashboard, project, and statistics data.
- `src/lib/queries.ts` contains parameterized SQL reads; `src/lib/db.ts` creates the server-only Neon client.
- `src/auth.ts` configures Auth.js with GitHub, upserts users by GitHub account ID, and adds the database user ID to JWT and session data.
- `src/proxy.ts` protects application routes and sends unauthenticated requests to `/login` with a relative `callbackUrl`.
- `src/lib/session.ts` provides `requireUser()` guards for data pages and Server Actions.
- The root navigation reads the session in a Suspense boundary; sign-in and sign-out are Server Actions.
- `src/app/actions.ts` contains Server Actions for writes. They validate `FormData` with Zod, execute parameterized SQL, and revalidate affected routes.
- Client form and Kanban components use `useActionState` and `useOptimistic` for submission feedback and responsive task moves.

## Setup

1. Install Node.js (20.9 or later) and npm.
2. Create a Neon project and database. Copy its pooled Postgres connection string from the Neon dashboard.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Set `DATABASE_URL` to the Neon connection string, including its SSL options. Set `AUTH_SECRET` to a secure random value, and set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` from your GitHub OAuth App. Configure its callback URL as `http://localhost:3000/api/auth/callback/github`. Do not commit `.env.local`.

5. In the Neon SQL Editor, run [`db/schema.sql`](./db/schema.sql) once against the new database. It creates the `users`, `projects`, and `tasks` tables, adds project ownership, and includes sample project and task records.
6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

## Database schema

- `users`: serial ID, unique GitHub ID, optional name, email, and image, plus a creation timestamp.
- `projects`: serial ID, optional owner reference to `users` with cascading deletion, required 2-80 character name, description, hex color, and creation timestamp.
- `tasks`: serial ID, project foreign key with cascading delete, required 2-140 character title, status (`todo`, `doing`, or `done`), priority (`low`, `medium`, or `high`), optional due date, and creation timestamp.

The schema also defines indexes on `projects.owner_id` and `tasks.project_id`, and check constraints for project names, task titles, status, and priority.

## OAuth flow

1. The user submits the GitHub sign-in form, and the Auth.js Server Action redirects the browser to GitHub.
2. The user authorizes the OAuth app on GitHub.
3. GitHub redirects to `/api/auth/callback/github` with an authorization code. Auth.js validates the OAuth state and exchanges the code for the user profile.
4. The JWT callback upserts the profile by GitHub account ID and stores the numeric `users.id` in the JWT.
5. Auth.js sets its session cookie. On later requests, the session callback exposes that database ID as `session.user.id`; the navbar renders the user menu from the server session.

## Route protection

The Next.js 16 `src/proxy.ts` convention redirects unauthenticated page requests, but it is not an authorization boundary for application code: Server Actions can be invoked directly, outside the UI navigation flow. Pages that read private data and data-mutating Server Actions therefore call `requireUser()` themselves. The GitHub sign-in action is intentionally public so unauthenticated users can start login; the sign-out action verifies the session.

The login action validates `callbackUrl` on the server and accepts only same-origin relative paths, falling back to `/` for external or malformed values.

## Validation

```bash
npm run lint
npm run build
```
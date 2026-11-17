# Security review: project ownership

The finding below was reported against baseline commit `2fd7b24`, before the remediation in this change.

## Finding

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/lib/queries.ts`; `src/app/actions.ts` | 55-229; 39-129 | Missing owner scoping allowed cross-user project/task reads and mutations | 10/10 |

## Remediation

- Project and task reads now require a user ID and filter through `projects.owner_id`.
- Project creation sets `owner_id`; task creation checks ownership of the target project.
- Task status updates and deletes join through the owning project; project deletes filter by owner.
- All mutations that can affect existing rows return an error when no row is affected.
- Statistics and overdue-task results are scoped to projects owned by the signed-in user.
- Existing ownerless projects can be assigned with the one-off statement in `db/backfill-project-owners.sql`. Replace its GitHub ID placeholder with the intended user's `users.github_id` before running it.

The GitHub sign-in action remains intentionally public because unauthenticated users need to start the login flow; it does not read or mutate project/task data. Sign-out requires an authenticated user.

## Query and action scope audit

### Queries in `src/lib/queries.ts`

| Query | Scoped by user? | Enforcement |
|---|---|---|
| `getProjects` | yes | Filters projects by `owner_id`; task counts are joined from those projects. |
| `getProject` | yes | Filters by project ID and `owner_id`. |
| `getTasks` | yes | Joins tasks to projects with the owner condition. |
| `getStatsData` aggregate query | yes | Aggregates only owned projects and tasks joined through owned projects. |
| `getStatsData` overdue query | yes | Joins tasks to projects with the owner condition. |

### Other database queries

| Query | Scoped by user? | Enforcement |
|---|---|---|
| Auth.js GitHub profile upsert (`src/auth.ts`) | yes | Matches only the authenticated provider account's unique `github_id`; it does not access project/task data. |
| Ownerless-project backfill (`db/backfill-project-owners.sql`) | yes | Targets only projects with `owner_id IS NULL` and the explicitly selected user's `github_id`. |

### Server Actions

| Action | Scoped by user? | Enforcement |
|---|---|---|
| `createProject` | yes | Requires a user and writes that user ID as `owner_id`. |
| `createTask` | yes | Requires a user and selects the target project by ID and owner. |
| `updateTaskStatus` | yes | Requires a user and updates only through an owned project. |
| `deleteTask` | yes | Requires a user and deletes only through an owned project. |
| `deleteProject` | yes | Requires a user and deletes by project ID and owner ID. |
| `signInWithGitHub` | no (public auth-only action) | Intentionally public; it only starts authentication and accesses no project/task data. |
| `signOutUser` | yes | Calls `requireUser()` before signing out. |

Validation completed: ESLint and TypeScript (`tsc --noEmit`) passed.

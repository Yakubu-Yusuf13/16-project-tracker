import { sql } from "@/lib/db";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  taskCount: number;
  doneCount: number;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAfter?: string;
  dueBefore?: string;
}

export async function getProjects(): Promise<ProjectSummary[]> {
  const rows = await sql`
    SELECT
      p.id,
      p.name,
      p.description,
      p.color,
      p.created_at AS "createdAt",
      COUNT(t.id)::int AS "taskCount",
      COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS "doneCount"
    FROM projects AS p
    LEFT JOIN tasks AS t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC, p.id DESC
  `;

  return rows as ProjectSummary[];
}

export async function getProject(id: number): Promise<ProjectSummary | null> {
  const rows = await sql`
    SELECT
      p.id,
      p.name,
      p.description,
      p.color,
      p.created_at AS "createdAt",
      COUNT(t.id)::int AS "taskCount",
      COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS "doneCount"
    FROM projects AS p
    LEFT JOIN tasks AS t ON t.project_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id
    LIMIT 1
  `;

  return (rows as ProjectSummary[])[0] ?? null;
}

export async function getTasks(
  projectId: number,
  filters: TaskFilters = {},
): Promise<Task[]> {
  const status = filters.status ?? null;
  const priority = filters.priority ?? null;
  const dueAfter = filters.dueAfter ?? null;
  const dueBefore = filters.dueBefore ?? null;

  const rows = await sql`
    SELECT
      id,
      project_id AS "projectId",
      title,
      status,
      priority,
      due_date AS "dueDate",
      created_at AS "createdAt"
    FROM tasks
    WHERE project_id = ${projectId}
      AND (${status}::text IS NULL OR status = ${status})
      AND (${priority}::text IS NULL OR priority = ${priority})
      AND (${dueAfter}::date IS NULL OR due_date >= ${dueAfter}::date)
      AND (${dueBefore}::date IS NULL OR due_date <= ${dueBefore}::date)
    ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `;

  return rows as Task[];
}
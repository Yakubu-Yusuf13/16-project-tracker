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
  q?: string;
}


export interface StatsAggregateRow {
  kind: "total" | "project-total" | "status" | "priority" | "project";
  label: string;
  count: number;
  doneCount: number;
  activeCount: number;
  completionPct: number;
  sharePct: number;
  projectId: number | null;
  color: string | null;
}

export interface OverdueTask {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  priority: TaskPriority;
  dueDate: string;
}
export async function getProjects(userId: number): Promise<ProjectSummary[]> {
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
    WHERE p.owner_id = ${userId}
    GROUP BY p.id
    ORDER BY p.created_at DESC, p.id DESC
  `;

  return rows as ProjectSummary[];
}

export async function getProject(userId: number, id: number): Promise<ProjectSummary | null> {
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
    WHERE p.id = ${id} AND p.owner_id = ${userId}
    GROUP BY p.id
    LIMIT 1
  `;

  return (rows as ProjectSummary[])[0] ?? null;
}

export async function getTasks(
  userId: number,
  projectId: number,
  filters: TaskFilters = {},
): Promise<Task[]> {
  const status = filters.status ?? null;
  const priority = filters.priority ?? null;
  const dueAfter = filters.dueAfter ?? null;
  const dueBefore = filters.dueBefore ?? null;
  const q = filters.q?.trim() || null;

  const rows = await sql`
    SELECT
      t.id,
      t.project_id AS "projectId",
      t.title,
      t.status,
      t.priority,
      t.due_date AS "dueDate",
      t.created_at AS "createdAt"
    FROM tasks AS t
    JOIN projects AS p ON p.id = t.project_id AND p.owner_id = ${userId}
    WHERE t.project_id = ${projectId}
      AND (${status}::text IS NULL OR t.status = ${status})
      AND (${priority}::text IS NULL OR t.priority = ${priority})
      AND (${dueAfter}::date IS NULL OR t.due_date >= ${dueAfter}::date)
      AND (${dueBefore}::date IS NULL OR t.due_date <= ${dueBefore}::date)
      AND (${q}::text IS NULL OR t.title ILIKE '%' || ${q} || '%')
    ORDER BY
      CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
  `;

  return rows as Task[];
}
export async function getStatsData(userId: number): Promise<{
  aggregates: StatsAggregateRow[];
  overdueTasks: OverdueTask[];
}> {
  const [aggregateRows, overdueRows] = await Promise.all([
    sql`
      WITH owned_projects AS (
        SELECT id, name, color
        FROM projects
        WHERE owner_id = ${userId}
      ),
      owned_tasks AS (
        SELECT t.*
        FROM tasks AS t
        JOIN projects AS p ON p.id = t.project_id AND p.owner_id = ${userId}
      ),
      task_totals AS (
        SELECT
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER (WHERE status = 'done')::int AS done_count,
          COUNT(*) FILTER (WHERE status <> 'done')::int AS active_count,
          COALESCE(
            ROUND(COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0)),
            0
          )::int AS completion_pct
        FROM owned_tasks
      )
      SELECT
        'total'::text AS kind,
        'Tasks'::text AS label,
        total_count AS count,
        done_count AS "doneCount",
        active_count AS "activeCount",
        completion_pct AS "completionPct",
        CASE WHEN total_count > 0 THEN 100 ELSE 0 END::int AS "sharePct",
        NULL::int AS "projectId",
        NULL::text AS color
      FROM task_totals
      UNION ALL
      SELECT
        'project-total',
        'Projects',
        COUNT(*)::int,
        0::int,
        0::int,
        0::int,
        CASE WHEN COUNT(*) > 0 THEN 100 ELSE 0 END::int,
        NULL::int,
        NULL::text
      FROM owned_projects
      UNION ALL
      SELECT
        'status',
        s.status,
        COUNT(t.id)::int,
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int,
        COUNT(t.id) FILTER (WHERE t.status <> 'done')::int,
        0::int,
        COALESCE(ROUND(COUNT(t.id) * 100.0 / NULLIF(tt.total_count, 0)), 0)::int,
        NULL::int,
        NULL::text
      FROM (VALUES ('todo'::text), ('doing'::text), ('done'::text)) AS s(status)
      LEFT JOIN owned_tasks AS t ON t.status = s.status
      CROSS JOIN task_totals AS tt
      GROUP BY s.status, tt.total_count
      UNION ALL
      SELECT
        'priority',
        p.priority,
        COUNT(t.id)::int,
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int,
        COUNT(t.id) FILTER (WHERE t.status <> 'done')::int,
        0::int,
        COALESCE(ROUND(COUNT(t.id) * 100.0 / NULLIF(tt.total_count, 0)), 0)::int,
        NULL::int,
        NULL::text
      FROM (VALUES ('low'::text), ('medium'::text), ('high'::text)) AS p(priority)
      LEFT JOIN owned_tasks AS t ON t.priority = p.priority
      CROSS JOIN task_totals AS tt
      GROUP BY p.priority, tt.total_count
      UNION ALL
      SELECT
        'project',
        p.name,
        COUNT(t.id)::int,
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int,
        COUNT(t.id) FILTER (WHERE t.status <> 'done')::int,
        COALESCE(
          ROUND(COUNT(t.id) FILTER (WHERE t.status = 'done') * 100.0 / NULLIF(COUNT(t.id), 0)),
          0
        )::int,
        COALESCE(ROUND(COUNT(t.id) * 100.0 / NULLIF(tt.total_count, 0)), 0)::int,
        p.id,
        p.color
      FROM owned_projects AS p
      LEFT JOIN owned_tasks AS t ON t.project_id = p.id
      CROSS JOIN task_totals AS tt
      GROUP BY p.id, p.name, p.color, tt.total_count
    `,
    sql`
      SELECT
        t.id,
        t.title,
        p.id AS "projectId",
        p.name AS "projectName",
        t.priority,
        t.due_date AS "dueDate"
      FROM tasks AS t
      JOIN projects AS p ON p.id = t.project_id AND p.owner_id = ${userId}
      WHERE t.due_date < CURRENT_DATE AND t.status <> 'done'
      ORDER BY t.due_date ASC, p.name ASC, t.title ASC
    `,
  ]);

  return {
    aggregates: aggregateRows as StatsAggregateRow[],
    overdueTasks: overdueRows as OverdueTask[],
  };
}
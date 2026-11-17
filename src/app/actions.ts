"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getTaskComments, type TaskComment } from "@/lib/queries";
import {
  DeleteProjectInput,
  DeleteTaskInput,
  ProjectInput,
  TaskCommentInput,
  TaskCommentScopeInput,
  TaskInput,
  TaskStatusUpdateInput,
  type ActionState,
} from "@/lib/validation";

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] } }): ActionState {
  const flattened = error.flatten();
  const errors = Object.fromEntries(
    Object.entries(flattened.fieldErrors).filter(([, messages]) => messages?.length),
  ) as Record<string, string[]>;
  if (flattened.formErrors.length) errors._form = flattened.formErrors;
  return { ok: false, errors };
}

async function runMutation<T>(label: string, query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch {
    console.error(`Failed to ${label}.`);
    return null;
  }
}

function mutationFailure(message: string): ActionState {
  return { ok: false, errors: { _form: [message] } };
}

const success: ActionState = { ok: true, errors: {} };

export type TaskCommentListState =
  | { ok: true; comments: TaskComment[] }
  | { ok: false; message: string };

export async function listTaskComments(
  projectId: number,
  taskId: number,
): Promise<TaskCommentListState> {
  const { id: userId } = await requireUser();
  const parsed = TaskCommentScopeInput.safeParse({ project_id: projectId, task_id: taskId });
  if (!parsed.success) return { ok: false, message: "Could not load comments for this task." };

  const comments = await runMutation("load task comments", () =>
    getTaskComments(userId, parsed.data.project_id, parsed.data.task_id),
  );
  if (!comments) return { ok: false, message: "Could not load comments right now. Please try again." };

  return { ok: true, comments };
}

export async function addTaskComment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = TaskCommentInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, task_id, body } = parsed.data;
  const rows = await runMutation("add task comment", () => sql`
    INSERT INTO task_comments (task_id, author_id, body)
    SELECT t.id, ${userId}, ${body}
    FROM tasks AS t
    JOIN projects AS p ON p.id = t.project_id AND p.owner_id = ${userId}
    WHERE t.id = ${task_id} AND t.project_id = ${project_id}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not add the comment right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Task not found or you do not have access to it.");

  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function createProject(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = ProjectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const rows = await runMutation("create project", () => sql`
    INSERT INTO projects (name, description, color, owner_id)
    VALUES (${parsed.data.name}, ${parsed.data.description}, ${parsed.data.color}, ${userId})
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not create the project right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Could not create the project.");

  revalidatePath("/");
  return success;
}

export async function createTask(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = TaskInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, title, status, priority, due_date } = parsed.data;
  const rows = await runMutation("create task", () => sql`
    INSERT INTO tasks (project_id, title, status, priority, due_date)
    SELECT p.id, ${title}, ${status}, ${priority}, ${due_date ?? null}::date
    FROM projects AS p
    WHERE p.id = ${project_id} AND p.owner_id = ${userId}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not create the task right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Project not found or you do not have access to it.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function updateTaskStatus(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = TaskStatusUpdateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, task_id, status } = parsed.data;
  const rows = await runMutation("update task status", () => sql`
    UPDATE tasks
    SET status = ${status}
    FROM projects AS p
    WHERE tasks.id = ${task_id}
      AND tasks.project_id = ${project_id}
      AND tasks.project_id = p.id
      AND p.owner_id = ${userId}
    RETURNING tasks.id
  `);
  if (!rows) return mutationFailure("Could not update the task right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Task not found in this project or you do not have access to it.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function deleteTask(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = DeleteTaskInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, task_id } = parsed.data;
  const rows = await runMutation("delete task", () => sql`
    DELETE FROM tasks
    USING projects
    WHERE tasks.id = ${task_id}
      AND tasks.project_id = ${project_id}
      AND tasks.project_id = projects.id
      AND projects.owner_id = ${userId}
    RETURNING tasks.id
  `);
  if (!rows) return mutationFailure("Could not delete the task right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Task not found in this project or you do not have access to it.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function deleteProject(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const { id: userId } = await requireUser();
  const parsed = DeleteProjectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id } = parsed.data;
  const rows = await runMutation("delete project", () => sql`
    DELETE FROM projects WHERE id = ${project_id} AND owner_id = ${userId}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not delete the project right now. Please try again.");
  if (rows.length === 0) return mutationFailure("Project not found or you do not have access to it.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}
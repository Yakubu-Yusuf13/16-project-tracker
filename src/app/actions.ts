"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  DeleteProjectInput,
  DeleteTaskInput,
  ProjectInput,
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
  } catch (error) {
    console.error(`Failed to ${label}.`, error);
    return null;
  }
}

function mutationFailure(message: string): ActionState {
  return { ok: false, errors: { _form: [message] } };
}

const success: ActionState = { ok: true, errors: {} };

export async function createProject(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = ProjectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const rows = await runMutation("create project", () => sql`
    INSERT INTO projects (name, description, color)
    VALUES (${parsed.data.name}, ${parsed.data.description}, ${parsed.data.color})
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not create the project. Check the database connection and try again.");

  revalidatePath("/");
  return success;
}

export async function createTask(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = TaskInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, title, status, priority, due_date } = parsed.data;
  const rows = await runMutation("create task", () => sql`
    INSERT INTO tasks (project_id, title, status, priority, due_date)
    SELECT p.id, ${title}, ${status}, ${priority}, ${due_date ?? null}::date
    FROM projects AS p
    WHERE p.id = ${project_id}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not create the task. Check the database connection and try again.");
  if (rows.length === 0) return mutationFailure("That project no longer exists.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function updateTaskStatus(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = TaskStatusUpdateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, task_id, status } = parsed.data;
  const rows = await runMutation("update task status", () => sql`
    UPDATE tasks SET status = ${status}
    WHERE id = ${task_id} AND project_id = ${project_id}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not update the task. Check the database connection and try again.");
  if (rows.length === 0) return mutationFailure("Task not found in this project.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function deleteTask(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = DeleteTaskInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id, task_id } = parsed.data;
  const rows = await runMutation("delete task", () => sql`
    DELETE FROM tasks WHERE id = ${task_id} AND project_id = ${project_id}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not delete the task. Check the database connection and try again.");
  if (rows.length === 0) return mutationFailure("Task not found in this project.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}

export async function deleteProject(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = DeleteProjectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { project_id } = parsed.data;
  const rows = await runMutation("delete project", () => sql`
    DELETE FROM projects WHERE id = ${project_id}
    RETURNING id
  `);
  if (!rows) return mutationFailure("Could not delete the project. Check the database connection and try again.");
  if (rows.length === 0) return mutationFailure("Project not found.");

  revalidatePath("/");
  revalidatePath(`/projects/${project_id}`);
  return success;
}
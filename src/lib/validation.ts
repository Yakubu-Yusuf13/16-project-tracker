import { z } from "zod";

export const ProjectInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
});

export const TaskInput = z.object({
  project_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(140),
  status: z.enum(["todo", "doing", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.iso.date().optional(),
  ),
});

export const TaskStatusUpdateInput = z.object({
  project_id: z.coerce.number().int().positive(),
  task_id: z.coerce.number().int().positive(),
  status: z.enum(["todo", "doing", "done"]),
});

export const DeleteTaskInput = z.object({
  project_id: z.coerce.number().int().positive(),
  task_id: z.coerce.number().int().positive(),
});

export const DeleteProjectInput = z.object({
  project_id: z.coerce.number().int().positive(),
});

export const TaskCommentScopeInput = z.object({
  project_id: z.coerce.number().int().positive(),
  task_id: z.coerce.number().int().positive(),
});

export const TaskCommentInput = TaskCommentScopeInput.extend({
  body: z.string().trim().min(1, "Write a comment.").max(2000, "Comments must be 2000 characters or fewer."),
});

export interface ActionState {
  ok: boolean;
  errors: Record<string, string[]>;
}

export const initialActionState: ActionState = { ok: false, errors: {} };
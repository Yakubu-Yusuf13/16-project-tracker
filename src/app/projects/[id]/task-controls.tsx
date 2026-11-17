"use client";

import { useActionState } from "react";
import { deleteTask, updateTaskStatus } from "@/app/actions";
import type { Task } from "@/lib/queries";
import { initialActionState } from "@/lib/validation";

export default function TaskControls({ projectId, task }: { projectId: number; task: Task }) {
  const [statusState, statusAction, statusPending] = useActionState(updateTaskStatus, initialActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTask, initialActionState);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={statusAction} className="flex items-center gap-2">
        <input type="hidden" name="project_id" defaultValue={projectId} />
        <input type="hidden" name="task_id" defaultValue={task.id} />
        <label className="sr-only" htmlFor={`status-${task.id}`}>Status for {task.title}</label>
        <select id={`status-${task.id}`} name="status" defaultValue={task.status} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm">
          <option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option>
        </select>
        <button type="submit" disabled={statusPending} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {statusPending ? "Saving..." : "Save"}
        </button>
      </form>
      {statusState.errors._form?.map((message) => <p key={message} className="text-xs text-rose-600" role="alert">{message}</p>)}
      <form action={deleteAction}>
        <input type="hidden" name="project_id" defaultValue={projectId} />
        <input type="hidden" name="task_id" defaultValue={task.id} />
        <button type="submit" disabled={deletePending} className="min-h-8 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
          {deletePending ? "Deleting..." : "Delete task"}
        </button>
        {deleteState.errors._form?.map((message) => <p key={message} className="text-xs text-rose-600" role="alert">{message}</p>)}
      </form>
    </div>
  );
}
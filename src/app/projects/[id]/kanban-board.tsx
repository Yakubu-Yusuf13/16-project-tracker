"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTask, updateTaskStatus } from "@/app/actions";
import type { Task, TaskStatus, TaskPriority } from "@/lib/queries";
import { initialActionState } from "@/lib/validation";

type BoardAction =
  | { type: "move"; taskId: number; status: TaskStatus }
  | { type: "delete"; taskId: number };

const columns: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To do" },
  { status: "doing", title: "Doing" },
  { status: "done", title: "Done" },
];

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-700",
};

function todayAsDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export default function KanbanBoard({ projectId, tasks }: { projectId: number; tasks: Task[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticTasks, dispatchOptimistic] = useOptimistic(
    tasks,
    (currentTasks: Task[], action: BoardAction) => {
      if (action.type === "delete") return currentTasks.filter((task) => task.id !== action.taskId);
      return currentTasks.map((task) => task.id === action.taskId ? { ...task, status: action.status } : task);
    },
  );

  function moveTask(task: Task, status: TaskStatus) {
    setError(null);
    startTransition(async () => {
      dispatchOptimistic({ type: "move", taskId: task.id, status });
      const formData = new FormData();
      formData.set("project_id", String(projectId));
      formData.set("task_id", String(task.id));
      formData.set("status", status);
      const result = await updateTaskStatus(initialActionState, formData);
      if (!result.ok) {
        setError(result.errors._form?.[0] ?? "Could not update the task.");
        return;
      }
      router.refresh();
    });
  }

  function removeTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      dispatchOptimistic({ type: "delete", taskId: task.id });
      const formData = new FormData();
      formData.set("project_id", String(projectId));
      formData.set("task_id", String(task.id));
      const result = await deleteTask(initialActionState, formData);
      if (!result.ok) {
        setError(result.errors._form?.[0] ?? "Could not delete the task.");
        return;
      }
      router.refresh();
    });
  }

  const today = todayAsDateString();

  return (
    <div>
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
      <div
        role="region"
        aria-label="Kanban board. Scroll horizontally to view all status columns."
        tabIndex={0}
        className="overflow-x-auto pb-2"
      >
        <div className="grid min-w-[780px] grid-cols-3 items-start gap-4">
        {columns.map((column, columnIndex) => {
          const columnTasks = optimisticTasks.filter((task) => task.status === column.status);
          return (
            <section key={column.status} aria-labelledby={`column-${column.status}`} className="min-h-64 rounded-2xl bg-slate-100/80 p-3">
              <header className="mb-3 flex items-center justify-between px-1 py-1">
                <h3 id={`column-${column.status}`} className="font-semibold text-slate-800">{column.title}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{columnTasks.length}</span>
              </header>
              {columnTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-8 text-center text-sm text-slate-500">No tasks here.</p>
              ) : (
                <ul className="space-y-3">
                  {columnTasks.map((task) => {
                    const overdue = task.status !== "done" && task.dueDate !== null && task.dueDate < today;
                    return (
                      <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className={`font-medium leading-5 ${task.status === "done" ? "text-slate-500" : "text-slate-900"}`}>{task.title}</h4>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${priorityStyles[task.priority]}`}>{task.priority}</span>
                        </div>
                        {task.dueDate && (
                          <p className={`mt-3 text-xs ${overdue ? "font-semibold text-rose-600" : "text-slate-500"}`}>
                            {overdue ? "Overdue - " : "Due "}{task.dueDate}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex gap-1">
                            {columnIndex > 0 && (
                              <button type="button" disabled={pending} onClick={() => moveTask(task, columns[columnIndex - 1].status)} aria-label={`Move ${task.title} left`} className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">Move left</button>
                            )}
                            {columnIndex < columns.length - 1 && (
                              <button type="button" disabled={pending} onClick={() => moveTask(task, columns[columnIndex + 1].status)} aria-label={`Move ${task.title} right`} className="rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-40">Move right</button>
                            )}
                          </div>
                          <button type="button" disabled={pending} onClick={() => removeTask(task)} aria-label={`Delete ${task.title}`} className="rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40">Delete</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        </div>
      </div>
    </div>
  );
}
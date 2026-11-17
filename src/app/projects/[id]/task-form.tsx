"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTask } from "@/app/actions";
import { initialActionState } from "@/lib/validation";

function FieldError({ errors, name }: { errors: Record<string, string[]>; name: string }) {
  const message = errors[name]?.[0];
  if (!message) return null;
  return <p id={`${name}-error`} className="mt-1 text-sm text-rose-600">{message}</p>;
}

export default function TaskForm({ projectId }: { projectId: number }) {
  const [state, action, pending] = useActionState(createTask, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="project_id" defaultValue={projectId} />
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
        Task title
        <input name="title" required minLength={2} maxLength={140} aria-describedby={state.errors.title ? "title-error" : undefined} className="mt-1.5 block min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="What needs to be done?" />
        <FieldError errors={state.errors} name="title" />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Priority
        <select name="priority" defaultValue="medium" className="mt-1.5 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <FieldError errors={state.errors} name="priority" />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Due date
        <input type="date" name="due_date" aria-describedby={state.errors.due_date ? "due_date-error" : undefined} className="mt-1.5 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" />
        <FieldError errors={state.errors} name="due_date" />
      </label>
      <input type="hidden" name="status" value="todo" readOnly />
      {state.errors._form?.map((message) => <p key={message} className="text-sm text-rose-600 sm:col-span-2" role="alert">{message}</p>)}
      {state.ok && <p className="text-sm text-emerald-700 sm:col-span-2" role="status">Task created.</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
          {pending ? "Creating..." : "Create task"}
        </button>
      </div>
    </form>
  );
}
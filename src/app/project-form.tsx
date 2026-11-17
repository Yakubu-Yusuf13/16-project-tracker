"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProject } from "@/app/actions";
import { initialActionState } from "@/lib/validation";

function FieldErrors({ errors, name }: { errors: Record<string, string[]>; name: string }) {
  const messages = errors[name];
  if (!messages?.length) return null;
  return <p id={`${name}-error`} className="mt-1 text-sm text-rose-600">{messages[0]}</p>;
}

export default function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">
        Project name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          aria-describedby={state.errors.name ? "name-error" : undefined}
          className="mt-1.5 block min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="e.g. Website refresh"
        />
        <FieldErrors errors={state.errors} name="name" />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Color
        <input type="color" name="color" defaultValue="#6366f1" className="mt-1.5 block h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />
        <FieldErrors errors={state.errors} name="color" />
      </label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">
        Description
        <textarea name="description" maxLength={2000} rows={2} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="What is this project about?" />
        <FieldErrors errors={state.errors} name="description" />
      </label>
      {state.errors._form?.map((message) => <p key={message} className="text-sm text-rose-600 sm:col-span-2" role="alert">{message}</p>)}
      {state.ok && <p className="text-sm text-emerald-700 sm:col-span-2" role="status">Project created.</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
          {pending ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}
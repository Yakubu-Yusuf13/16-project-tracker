"use client";

import { useActionState } from "react";
import { deleteProject } from "@/app/actions";
import { initialActionState } from "@/lib/validation";

export default function DeleteProjectForm({ projectId }: { projectId: number }) {
  const [state, action, pending] = useActionState(deleteProject, initialActionState);

  return (
    <form action={action}>
      <input type="hidden" name="project_id" defaultValue={projectId} />
      <button type="submit" disabled={pending} className="rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
        {pending ? "Deleting..." : "Delete"}
      </button>
      {state.errors._form?.map((message) => <p key={message} className="mt-2 text-xs text-rose-600" role="alert">{message}</p>)}
    </form>
  );
}
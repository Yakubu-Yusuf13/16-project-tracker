"use client";

import { useActionState, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { addTaskComment, listTaskComments } from "@/app/actions";
import type { Task, TaskComment } from "@/lib/queries";
import { initialActionState, type ActionState } from "@/lib/validation";

export default function TaskDetailDrawer({
  projectId,
  task,
  onClose,
}: {
  projectId: number;
  task: Task;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [state, action, pending] = useActionState(
    async (previousState: ActionState, formData: FormData) => {
      const result = await addTaskComment(previousState, formData);
      if (result.ok) {
        formRef.current?.reset();
        setLoadError(null);
        setReloadCount((count) => count + 1);
      }
      return result;
    },
    initialActionState,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void listTaskComments(projectId, task.id)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setComments(result.comments);
          setLoadError(null);
        } else {
          setLoadError(result.message);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load comments right now. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, task.id, reloadCount]);

  function closeOnCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="task-detail-title"
      onCancel={closeOnCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 m-0 h-full max-h-none w-full max-w-xl border-0 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Task details</p>
            <h2 id="task-detail-title" className="mt-2 break-words text-xl font-semibold">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {task.status === "todo" ? "To do" : task.status === "doing" ? "Doing" : "Done"}
              {task.dueDate ? ` · Due ${task.dueDate}` : ""}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </header>

        <section
          aria-labelledby="task-comments-heading"
          aria-busy={loading}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        >
          <h3 id="task-comments-heading" className="text-lg font-semibold">Comments</h3>
          {loading && <p className="mt-4 text-sm text-slate-600" role="status">Loading comments…</p>}
          {loadError && <p className="mt-4 text-sm text-rose-700" role="alert">{loadError}</p>}
          {!loading && !loadError && comments.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
              No comments yet. Add the first one below.
            </p>
          )}
          {comments.length > 0 && (
            <ol className="mt-4 space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{comment.body}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>{comment.authorName || "Project member"}</span>
                    <time dateTime={comment.createdAt}>
                      {comment.createdAt.replace("T", " ").replace("Z", " UTC")}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <form ref={formRef} action={action} className="border-t border-slate-200 bg-white px-6 py-5">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="task_id" value={task.id} />
          <label htmlFor="task-comment-body" className="text-sm font-medium text-slate-800">
            Add a comment
          </label>
          <textarea
            id="task-comment-body"
            name="body"
            required
            minLength={1}
            maxLength={2000}
            rows={3}
            aria-describedby={state.errors.body ? "task-comment-error" : undefined}
            className="mt-2 block w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Write an update…"
          />
          {state.errors.body?.[0] && (
            <p id="task-comment-error" className="mt-1 text-sm text-rose-700" role="alert">
              {state.errors.body[0]}
            </p>
          )}
          {state.errors._form?.map((message) => (
            <p key={message} className="mt-2 text-sm text-rose-700" role="alert">{message}</p>
          ))}
          {state.ok && <p className="mt-2 text-sm text-emerald-700" role="status">Comment added.</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

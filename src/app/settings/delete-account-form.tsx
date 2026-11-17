"use client";

import { useActionState } from "react";
import { deleteAccount } from "./actions";

export default function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, { error: "" });

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <label htmlFor="account-confirmation" className="block text-sm font-medium text-slate-700">
        Type <span className="font-mono">DELETE</span> to confirm
      </label>
      <input
        id="account-confirmation"
        name="confirmation"
        type="text"
        required
        pattern="DELETE"
        maxLength={6}
        autoComplete="off"
        className="min-h-11 w-full max-w-xs rounded-xl border border-slate-300 px-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
        aria-describedby={state.error ? "delete-account-error" : undefined}
      />
      <div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-rose-700 px-5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Deleting account..." : "Delete my account"}
        </button>
      </div>
      {state.error && (
        <p id="delete-account-error" role="alert" className="text-sm text-rose-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          We couldn’t load your projects
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Check your database connection and try again. If the problem continues, check the server logs.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
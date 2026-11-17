import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Page not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          We couldn’t find that page
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The link may be incorrect, or the page may have been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Return to projects
        </Link>
      </section>
    </main>
  );
}

export default function Loading() {
  return (
    <main
      className="mx-auto min-h-screen w-full max-w-6xl animate-pulse px-5 py-10 sm:px-8 lg:py-14"
      aria-label="Loading projects"
    >
      <div className="mb-10">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-64 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>
      <div className="mb-4 h-6 w-36 rounded bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-1.5 bg-slate-200" />
            <div className="p-6">
              <div className="h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-8 h-2 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
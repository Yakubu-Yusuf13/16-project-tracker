import type { Metadata } from "next";
import Link from "next/link";
import { getStatsData, type StatsAggregateRow } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Statistics | Project Tracker",
  description: "Project and task completion statistics.",
};

export const dynamic = "force-dynamic";

function BarChart({ title, rows }: { title: string; rows: StatsAggregateRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label={title}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <ul className="mt-5 space-y-5">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium capitalize text-slate-700">{row.label}</span>
              <span className="text-slate-500">{row.count} ({row.sharePct}%)</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${row.label} share`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.sharePct}>
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.sharePct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function StatsPage() {
  const { id: userId } = await requireUser();
  const { aggregates, overdueTasks } = await getStatsData(userId);
  const totals = aggregates.find((row) => row.kind === "total");
  const projectTotal = aggregates.find((row) => row.kind === "project-total");
  if (!totals || !projectTotal) throw new Error("Statistics query did not return total rows.");

  const statusOrder = ["todo", "doing", "done"];
  const priorityOrder = ["low", "medium", "high"];
  const statusRows = aggregates
    .filter((row) => row.kind === "status")
    .sort((a, b) => statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label));
  const priorityRows = aggregates
    .filter((row) => row.kind === "priority")
    .sort((a, b) => priorityOrder.indexOf(a.label) - priorityOrder.indexOf(b.label));
  const projectRows = aggregates
    .filter((row) => row.kind === "project")
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">&lt;- All projects</Link>
      <header className="mt-6 mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Workspace overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Statistics</h1>
        <p className="mt-2 text-sm text-slate-500">A summary of task progress across your projects.</p>
      </header>

      <section aria-label="Overall totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total tasks</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.count}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{totals.doneCount}</p>
          <p className="mt-1 text-xs text-slate-500">{totals.completionPct}% overall completion</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active tasks</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-700">{totals.activeCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Overdue tasks</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{overdueTasks.length}</p>
          <p className="mt-1 text-xs text-slate-500">Across {projectTotal.count} {projectTotal.count === 1 ? "project" : "projects"}</p>
        </article>
      </section>

      <section aria-label="Task breakdown charts" className="mt-6 grid gap-4 lg:grid-cols-2">
        <BarChart title="Tasks by status" rows={statusRows} />
        <BarChart title="Tasks by priority" rows={priorityRows} />
      </section>

      <section aria-labelledby="project-completion-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="project-completion-heading" className="text-lg font-semibold text-slate-900">Completion by project</h2>
        {projectRows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No projects to report yet.</p>
        ) : (
          <ul className="mt-5 space-y-5">
            {projectRows.map((project) => (
              <li key={project.projectId}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <Link href={`/projects/${project.projectId}`} className="font-medium text-slate-800 hover:text-indigo-700">{project.label}</Link>
                  <span className="shrink-0 text-slate-500">{project.doneCount}/{project.count} tasks ({project.completionPct}%)</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${project.label} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={project.completionPct}>
                  <div className="h-full rounded-full" style={{ width: `${project.completionPct}%`, backgroundColor: project.color ?? "#6366f1" }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="overdue-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="overdue-heading" className="text-lg font-semibold text-slate-900">Overdue tasks</h2>
        {overdueTasks.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No overdue tasks. Nice work!</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {overdueTasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <Link href={`/projects/${task.projectId}`} className="mt-1 text-sm text-slate-500 hover:text-indigo-700">{task.projectName}</Link>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="capitalize text-slate-500">{task.priority} priority</span>
                  <time dateTime={task.dueDate} className="font-medium text-rose-600">Due {task.dueDate}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
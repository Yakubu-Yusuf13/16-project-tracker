import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getTasks, type TaskPriority } from "@/lib/queries";
import TaskForm from "@/app/projects/[id]/task-form";
import KanbanBoard from "@/app/projects/[id]/kanban-board";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ priority?: string | string[]; q?: string | string[] }>;
};

const priorities: TaskPriority[] = ["low", "medium", "high"];
function isTaskPriority(value: string): value is TaskPriority {
  return priorities.some((priority) => priority === value);
}

export async function generateMetadata({ params }: Pick<ProjectPageProps, "params">): Promise<Metadata> {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return { title: "Project not found | Project Tracker" };
  }

  const project = await getProject(projectId);
  if (!project) return { title: "Project not found | Project Tracker" };

  return {
    title: `${project.name} | Project Tracker`,
    description: project.description || `Tasks and progress for ${project.name}.`,
  };
}
export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) notFound();

  const project = await getProject(projectId);
  if (!project) notFound();

  const priority = typeof query.priority === "string" && isTaskPriority(query.priority)
    ? query.priority
    : undefined;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const tasks = await getTasks(projectId, { priority, q: q || undefined });
  const progress = project.taskCount ? Math.round((project.doneCount / project.taskCount) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <Link href="/" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">&lt;- All projects</Link>
      <header className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2" style={{ backgroundColor: project.color }} />
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{project.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{project.description || "No description provided."}</p>
          <div className="mt-6 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{project.doneCount} of {project.taskCount} tasks complete</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="new-task-heading" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="new-task-heading" className="mb-5 text-lg font-semibold text-slate-900">New task</h2>
        <TaskForm projectId={projectId} />
      </section>

      <section aria-labelledby="tasks-heading" className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="tasks-heading" className="text-lg font-semibold text-slate-900">Kanban board</h2>
            <p className="mt-1 text-sm text-slate-500">{tasks.length} matching {tasks.length === 1 ? "task" : "tasks"}</p>
          </div>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-slate-600">
              Priority
              <select name="priority" defaultValue={priority ?? ""} className="mt-1 block min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Search tasks
              <input type="search" name="q" defaultValue={q} maxLength={100} placeholder="e.g. design" className="mt-1 block min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm" />
            </label>
            <button type="submit" className="min-h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">Filter</button>
            {(priority || q) && <Link href={`/projects/${projectId}`} className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Clear</Link>}
          </form>
        </div>
        <KanbanBoard projectId={projectId} tasks={tasks} />
      </section>
    </main>
  );
}
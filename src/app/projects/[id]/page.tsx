import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getTasks } from "@/lib/queries";
import TaskForm from "@/app/projects/[id]/task-form";
import TaskControls from "@/app/projects/[id]/task-controls";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

const statusLabels = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
} as const;

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) notFound();

  const project = await getProject(projectId);
  if (!project) notFound();

  const tasks = await getTasks(projectId);
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
        <div className="mb-4 flex items-center justify-between">
          <h2 id="tasks-heading" className="text-lg font-semibold text-slate-900">Tasks</h2>
          <span className="text-sm text-slate-500">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
        </div>
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No tasks yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className={`font-medium ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{statusLabels[task.status]}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">{task.priority} priority</span>
                    {task.dueDate && <span>Due {task.dueDate}</span>}
                  </div>
                </div>
                <TaskControls projectId={projectId} task={task} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
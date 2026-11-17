import Link from "next/link";
import { getProjects } from "@/lib/queries";
import DeleteProjectForm from "@/app/delete-project-form";
import ProjectForm from "@/app/project-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();
  const totalTasks = projects.reduce((total, project) => total + project.taskCount, 0);
  const completedTasks = projects.reduce((total, project) => total + project.doneCount, 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Project tracker</h1>
          <p className="mt-2 text-sm text-slate-500">A clear view of your projects and their progress.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/stats" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50">Statistics</Link>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Projects</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{projects.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Tasks complete</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{completedTasks}<span className="font-normal text-slate-600">/{totalTasks}</span></p>
          </div>
        </div>
      </header>

      <section aria-labelledby="new-project-heading" className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="new-project-heading" className="mb-5 text-lg font-semibold text-slate-900">New project</h2>
        <ProjectForm />
      </section>

      <section aria-labelledby="projects-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="projects-heading" className="text-lg font-semibold text-slate-900">Your projects</h2>
          <span className="text-sm text-slate-500">{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h3 className="font-semibold text-slate-900">No projects yet</h3>
            <p className="mt-2 text-sm text-slate-500">Create your first project above to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const progress = project.taskCount ? Math.round((project.doneCount / project.taskCount) * 100) : 0;
              return (
                <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="h-1.5" style={{ backgroundColor: project.color }} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">
                          <Link href={`/projects/${project.id}`} className="rounded-sm hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">{project.name}</Link>
                        </h3>
                        <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{project.description || "No description provided."}</p>
                      </div>
                      <span className="mt-1 size-3 shrink-0 rounded-full ring-4 ring-slate-50" style={{ backgroundColor: project.color }} aria-label={`Project color ${project.color}`} />
                    </div>
                    <div className="mt-7">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">Progress</span>
                        <span className="text-slate-500">{project.doneCount} of {project.taskCount} tasks</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${project.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                        <div className="h-full rounded-full transition-[width]" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
                      <DeleteProjectForm projectId={project.id} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
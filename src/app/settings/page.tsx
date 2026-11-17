import type { Metadata } from "next";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import DeleteAccountForm from "./delete-account-form";

export const metadata: Metadata = {
  title: "Settings | Project Tracker",
  description: "Manage your profile and account.",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Account</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Your profile details are provided by GitHub.</p>
      </header>

      <section aria-labelledby="profile-heading" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="profile-heading" className="text-lg font-semibold text-slate-900">GitHub profile</h2>
        <div className="mt-5 flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full"
            />
          ) : (
            <div aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
              {(user.name ?? "G").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-950">{user.name ?? "GitHub user"}</p>
            <p className="mt-1 text-sm text-slate-500">{user.email ?? "No public email on your GitHub profile."}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="delete-account-heading" className="mt-8 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h2 id="delete-account-heading" className="text-lg font-semibold text-rose-800">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This permanently deletes your account and all projects and tasks you own. This action cannot be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}

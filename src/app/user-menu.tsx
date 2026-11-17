import Image from "next/image";
import { auth } from "@/auth";
import { connection } from "next/server";
import { signInWithGitHub, signOutUser } from "@/app/auth-actions";

export default async function UserMenu() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    return (
      <form action={signInWithGitHub}>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign in with GitHub
        </button>
      </form>
    );
  }

  const displayName = session.user.name?.trim() || session.user.email || "GitHub user";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {session.user.image ? (
        <Image
          src={session.user.image}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
        >
          {initial}
        </span>
      )}
      <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:inline">
        {displayName}
      </span>
      <form action={signOutUser}>
        <button
          type="submit"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

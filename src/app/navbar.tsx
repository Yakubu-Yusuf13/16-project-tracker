import { Suspense } from "react";
import Link from "next/link";
import UserMenu from "@/app/user-menu";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8"
      >
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          Project Tracker
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/stats"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-700"
          >
            Statistics
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-700"
          >
            Settings
          </Link>
          <Suspense
            fallback={
              <span
                aria-hidden="true"
                className="h-10 w-24 animate-pulse rounded-xl bg-slate-100"
              />
            }
          >
            <UserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

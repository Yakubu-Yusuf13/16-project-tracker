import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type RequiredUser = {
  id: number;
  name: string | null;
  email: string | null;
  image: string | null;
};

export async function requireUser(): Promise<RequiredUser> {
  const session = await auth();
  const sessionUser = session?.user;
  const id = Number(sessionUser?.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    redirect("/login");
  }

  return {
    id,
    name: sessionUser?.name ?? null,
    email: sessionUser?.email ?? null,
    image: sessionUser?.image ?? null,
  };
}

export function getSafeCallbackUrl(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return "/";
  }

  const origin = "https://project-tracker.invalid";
  const url = new URL(value, origin);
  if (url.origin !== origin) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(): Promise<{ id: number }> {
  const session = await auth();
  const id = Number(session?.user?.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    redirect("/login");
  }

  return { id };
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

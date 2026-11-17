"use server";

import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { getSafeCallbackUrl, requireUser } from "@/lib/session";

export async function signInWithGitHub(formData: FormData) {
  let callbackUrl = formData.get("callbackUrl");
  if (callbackUrl === null) {
    const referer = (await headers()).get("referer");
    if (referer) {
      try {
        callbackUrl = new URL(referer).searchParams.get("callbackUrl");
      } catch {
        callbackUrl = null;
      }
    }
  }

  await signIn("github", {
    redirectTo: getSafeCallbackUrl(callbackUrl),
  });
}

export async function signOutUser() {
  await requireUser();
  await signOut({ redirectTo: "/login" });
}

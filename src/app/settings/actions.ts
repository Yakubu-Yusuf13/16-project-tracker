"use server";

import { signOut } from "@/auth";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function deleteAccount(
  _previousState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const { id: userId } = await requireUser();
  if (formData.get("confirmation") !== "DELETE") {
    return { error: "Type DELETE exactly to confirm account deletion." };
  }

  let deletedCount = 0;
  try {
    const rows = await sql`
      DELETE FROM users
      WHERE id = ${userId}
      RETURNING id
    `;
    deletedCount = rows.length;
  } catch (error) {
    console.error("Failed to delete account.", error);
    return { error: "Could not delete your account. Please try again." };
  }

  if (deletedCount === 0) {
    return { error: "Account not found. It may already have been deleted." };
  }

  await signOut({ redirectTo: "/login" });
  return { error: "" };
}

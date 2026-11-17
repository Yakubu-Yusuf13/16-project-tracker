import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { sql } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    signIn({ account }) {
      return account?.provider === "github";
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "github") {
        if (!user) {
          throw new Error("GitHub sign-in did not provide a user profile.");
        }

        const rows = await sql`
          INSERT INTO users (github_id, name, email, image)
          VALUES (
            ${account.providerAccountId},
            ${user.name},
            ${user.email},
            ${user.image}
          )
          ON CONFLICT (github_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            image = EXCLUDED.image
          RETURNING id
        `;

        const userId = rows[0]?.id;
        if (typeof userId !== "number" || !Number.isSafeInteger(userId)) {
          throw new Error("GitHub sign-in did not return a valid database user ID.");
        }

        token.userId = userId;
      }

      return token;
    },
    session({ session, token }) {
      if (typeof token.userId !== "number") {
        throw new Error("The Auth.js session is missing its database user ID.");
      }

      if (!session.user) {
        throw new Error("The Auth.js session is missing its user profile.");
      }

      Object.assign(session.user, { id: token.userId });
      return session;
    },
  },
});

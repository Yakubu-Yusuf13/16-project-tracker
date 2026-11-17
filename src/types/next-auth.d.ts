import type { DefaultSession } from "next-auth";

export type AppSession = Omit<DefaultSession, "user"> & {
  user: Omit<NonNullable<DefaultSession["user"]>, "id"> & {
    id: number;
  };
};

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number;
  }
}

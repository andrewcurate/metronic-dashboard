// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Often optional depending on provider/flow
      name?: string | null;
      email?: string | null;
      avatar?: string | null;

      // What our route sets
      role?: string | null;       // e.g. "Administrator"
      status?: "ACTIVE" | "INACTIVE" | string;

      // Keep these too, but optional
      roleId?: string | null;
      roleName?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;

    role?: string | null;
    status?: "ACTIVE" | "INACTIVE" | string;

    roleId?: string | null;
    roleName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;

    role?: string | null;
    status?: "ACTIVE" | "INACTIVE" | string;

    roleId?: string | null;
    roleName?: string | null;
  }
}

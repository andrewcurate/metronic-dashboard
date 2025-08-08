/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient, UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

// ---- Module augmentation so we can safely add fields to token/session
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}

// ---- Validate incoming creds
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (
        rawCreds
      ): Promise<{ id: string; email: string; name: string | null; role?: string } | null> => {
        const parsed = credentialsSchema.safeParse(rawCreds);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });
        if (!user || !user.password) return null;

        // If you enforce ACTIVE users only, keep this check
        if (user.status && user.status !== UserStatus.ACTIVE) return null;

        const ok = await compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role?.slug,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        // user comes from authorize()
        const u = user as { id: string; role?: string };
        token.userId = u.id;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

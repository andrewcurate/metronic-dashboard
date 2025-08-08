import NextAuth, { type NextAuthOptions, type User as NextAuthUser, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

type JwtWithUserId = JWT & { userId?: string };
type SessionWithUserId = Session & { userId?: string };

const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        // Your app’s NextAuth.User has a required `status` field (augmented type).
        // Build an object that includes it and cast to NextAuthUser (no `any`).
        const nextUser = {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          status: user.status, // <- required by your augmented NextAuth User
        } as unknown as NextAuthUser;

        return nextUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JwtWithUserId> {
      const t = token as JwtWithUserId;
      if (user && "id" in user && typeof (user as { id?: unknown }).id === "string") {
        t.userId = (user as { id: string }).id;
      }
      return t;
    },
    async session({ session, token }): Promise<SessionWithUserId> {
      const t = token as JwtWithUserId;
      return {
        ...session,
        userId: t.userId,
      };
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

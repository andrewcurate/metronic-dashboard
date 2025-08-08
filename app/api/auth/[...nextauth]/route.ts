import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Optional (allowed) export – doesn’t conflict with route handler rules
export const runtime = "nodejs";

type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED"; // keep in sync with your DB enum

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Basic guards
        if (!credentials?.email || !credentials?.password) return null;

        // Find user + role
        const userRecord = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!userRecord || !userRecord.password) return null;

        // Check password
        const ok = await bcrypt.compare(credentials.password, userRecord.password);
        if (!ok) return null;

        // Only allow ACTIVE users (adjust if you want others)
        const status = (userRecord.status as UserStatus) ?? "INACTIVE";
        if (status !== "ACTIVE") {
          // You could throw an error here to show a message:
          // throw new Error("Account is not active.");
          return null;
        }

        // Return the shape you declared in next-auth.d.ts
        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name ?? "",
          avatar: userRecord.avatar ?? null,
          roleId: userRecord.roleId ?? null,
          roleName: userRecord.role?.name ?? null,
          status,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, merge user fields into the token
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = (user as { name?: string })?.name ?? token.name;
        token.avatar = (user as { avatar?: string | null })?.avatar ?? null;
        token.roleId = (user as { roleId?: string | null })?.roleId ?? null;
        token.roleName = (user as { roleName?: string | null })?.roleName ?? null;
        token.status = (user as { status: UserStatus }).status;
      }
      return token;
    },

    async session({ session, token }) {
      // Populate session.user from token (matches your module augmentation)
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.avatar = (token as { avatar?: string | null }).avatar ?? null;
        session.user.roleId = (token as { roleId?: string | null }).roleId ?? null;
        session.user.roleName = (token as { roleName?: string | null }).roleName ?? null;
        session.user.status = (token as { status: UserStatus }).status;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
};

// IMPORTANT: Only export the handler (GET/POST). Do NOT export authOptions.
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

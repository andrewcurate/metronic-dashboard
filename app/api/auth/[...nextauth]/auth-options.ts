import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const authOptions: NextAuthOptions = {
  debug: true, // Show detailed debug info in Vercel logs

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing email or password in authorize()");
          return null;
        }

        // Fetch user from DB including password for bcrypt check
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true, // IMPORTANT for bcrypt
            status: true,
            roleId: true,
            role: { select: { name: true } },
          },
        });

        if (!user) {
          console.error("No user found for email:", credentials.email);
          return null;
        }

        if (user.status !== "ACTIVE") {
          console.error("User is not active:", user.email);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password ?? ""
        );

        if (!passwordMatch) {
          console.error("Invalid password for email:", user.email);
          return null;
        }

        // Return safe user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          roleId: user.roleId ?? null,
          roleName: user.role?.name ?? null,
          status: user.status,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roleId = user.roleId ?? null;
        token.roleName = (user as any).roleName ?? null;
        token.status = (user as any).status ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.roleId = token.roleId as string | null;
        session.user.roleName = token.roleName as string | null;
        session.user.status = token.status as string | null;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/signin",
  },
};

export default authOptions;

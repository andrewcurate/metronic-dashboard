// app/api/auth/[...nextauth]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user) return null;
        if (!user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.slug ?? null,
          status: user.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? null;
        token.status = (user as any).status ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session?.user) {
        // @ts-expect-error custom field
        session.user.id = token.id as string;
        // @ts-expect-error custom field
        session.user.role = (token as any)?.role ?? null;
        // @ts-expect-error custom field
        session.user.status = (token as any)?.status ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

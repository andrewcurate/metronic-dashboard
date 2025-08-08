// app/api/auth/[...nextauth]/auth-options.ts
import type { NextAuthOptions, User as NextAuthUser, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const isProd = process.env.NODE_ENV === "production";

const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // NOTE: remove unused _req param to satisfy ESLint
      async authorize(rawCreds) {
        const parsed = credentialsSchema.safeParse(rawCreds ?? {});
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            status: true,
            avatar: true,
            roleId: true,
            role: { select: { name: true } },
          },
        });

        if (!user || !user.password) return null;
        if (user.status !== "ACTIVE") return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const out: NextAuthUser = {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          image: user.avatar ?? undefined,
        };
        // augment so we can forward via JWT callback
        // (these match your next-auth.d.ts augmentation)
        // @ts-expect-error custom fields passed via jwt callback
        out.roleId = user.roleId ?? null;
        // @ts-expect-error custom fields passed via jwt callback
        out.roleName = user.role?.name ?? null;
        // @ts-expect-error custom fields passed via jwt callback
        out.status = user.status;

        return out;
      },
    }),
  ],

  callbacks: {
    // Remove unused account/profile to satisfy ESLint
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: NextAuthUser | AdapterUser;
    }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        // @ts-expect-error carried from authorize()
        token.roleId = (user as NextAuthUser & { roleId?: string | null }).roleId ?? null;
        // @ts-expect-error carried from authorize()
        token.roleName = (user as NextAuthUser & { roleName?: string | null }).roleName ?? null;
        // @ts-expect-error carried from authorize()
        token.status = (user as NextAuthUser & { status?: string }).status ?? "INACTIVE";
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & {
        id?: string;
        roleId?: string | null;
        roleName?: string | null;
        status?: string;
        image?: string | null;
      };
    }): Promise<Session> {
      session.user = {
        id: (token.id as string) || "",
        name: (session.user?.name as string) || (token.name as string) || "",
        email: (session.user?.email as string) || (token.email as string) || "",
        avatar:
          (token as unknown as { avatar?: string | null }).avatar ??
          (token.image ?? null),
        roleId: token.roleId ?? null,
        roleName: token.roleName ?? null,
        status: (token.status as string) || "INACTIVE",
      };
      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  debug: !isProd,
};

export default authOptions;

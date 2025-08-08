// app/api/auth/[...nextauth]/auth-options.ts
import type { NextAuthOptions, User as NextAuthUser, Session, Account, Profile } from "next-auth";
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
      async authorize(rawCreds, _req) {
        // Validate inputs
        const parsed = credentialsSchema.safeParse(rawCreds ?? {});
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        // Load user (must include password & status)
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

        if (!user || !user.password) {
          // Avoid leaking which part failed
          return null;
        }

        // Only allow ACTIVE users
        if (user.status !== "ACTIVE") {
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Return a minimal user object; extra fields will be added to JWT in callbacks
        const out: NextAuthUser = {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          // NextAuth core only knows image; we’ll copy avatar via JWT in callbacks
          image: user.avatar ?? undefined,
        };
        // @ts-expect-error augment at runtime in jwt callback
        out.roleId = user.roleId ?? null;
        // @ts-expect-error augment at runtime in jwt callback
        out.roleName = user.role?.name ?? null;
        // @ts-expect-error augment at runtime in jwt callback
        out.status = user.status;

        return out;
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
      account,
      profile,
    }: {
      token: JWT;
      user?: NextAuthUser | AdapterUser;
      account?: Account | null;
      profile?: Profile | undefined;
    }): Promise<JWT> {
      // On login, copy extra fields from user to token
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        // @ts-expect-error copied from authorize() augmentation
        token.roleId = (user as NextAuthUser & { roleId?: string | null }).roleId ?? null;
        // @ts-expect-error copied from authorize() augmentation
        token.roleName = (user as NextAuthUser & { roleName?: string | null }).roleName ?? null;
        // @ts-expect-error copied from authorize() augmentation
        token.status = (user as NextAuthUser & { status?: string }).status ?? "INACTIVE";
        // Map avatar to image if present
        // NextAuth's JWT doesn't have avatar; keep image consistent
        if ("image" in user && user.image) {
          // nothing else to do; session callback will read token.image
        }
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
      };
    }): Promise<Session> {
      // Ensure required shape for your module augmentation
      session.user = {
        id: (token.id as string) || "",
        name: (session.user?.name as string) || (token.name as string) || "",
        email: (session.user?.email as string) || (token.email as string) || "",
        avatar: (token as unknown as { avatar?: string | null }).avatar ?? (token as unknown as { image?: string }).image ?? null,
        roleId: token.roleId ?? null,
        roleName: token.roleName ?? null,
        status: (token.status as string) || "INACTIVE",
      };

      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin", // show auth errors on the sign-in page
  },

  debug: !isProd,
};

export default authOptions;

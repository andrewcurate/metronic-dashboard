// app/api/auth/[...nextauth]/auth-options.ts
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import type { JWT } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

/**
 * We rely on your module augmentation in next-auth.d.ts:
 * - Session.user: { id, name, email, avatar?, roleId?, roleName?, status }
 * - JWT: { id, name, email, avatar?, roleId?, roleName?, status }
 */

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Get the user and include role for roleName
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordOk = await compare(credentials.password, user.password)
        if (!passwordOk) {
          return null
        }

        // Block non-active accounts
        if (user.status !== 'ACTIVE') {
          return null
        }

        // Build the shape NextAuth expects, plus our extra fields (typed via module augmentation)
        const base = {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }

        // Return as NextAuthUser (extra fields are supported via your augmentation)
        const authUser = {
          ...base,
          avatar: user.avatar ?? null,
          roleId: user.roleId ?? null,
          roleName: user.role?.name ?? null,
          status: user.status,
        } satisfies NextAuthUser & {
          avatar?: string | null
          roleId?: string | null
          roleName?: string | null
          status: string
        }

        // NextAuth only *requires* id/email/name here; the rest we’ll copy onto JWT in the callback
        return authUser
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // token is your augmented JWT type
      // On initial sign-in, user will be defined — copy fields to the token
      if (user) {
        const u = user as NextAuthUser & {
          avatar?: string | null
          roleId?: string | null
          roleName?: string | null
          status?: string
        }

        // Core fields
        if (!token.id && 'id' in u && typeof (u as { id?: unknown }).id === 'string') {
          token.id = (u as unknown as { id: string }).id
        }
        token.email = u.email ?? token.email
        token.name = u.name ?? token.name

        // Extra fields from your augmentation
        token.avatar = u.avatar ?? null
        token.roleId = u.roleId ?? null
        token.roleName = u.roleName ?? null
        token.status = u.status ?? token.status ?? 'INACTIVE'
      }

      return token as JWT
    },

    async session({ session, token }) {
      if (session.user) {
        // Core fields
        session.user.id = (token.id as string) ?? session.user.id
        session.user.email = (token.email as string) ?? session.user.email
        session.user.name = (token.name as string) ?? session.user.name

        // Extra fields from your augmentation
        session.user.avatar = (token.avatar as string | null) ?? null
        session.user.roleId = (token.roleId as string | null) ?? null
        session.user.roleName = (token.roleName as string | null) ?? null
        session.user.status = (token.status as string) ?? 'INACTIVE'
      }
      return session
    },
  },
}

export default authOptions

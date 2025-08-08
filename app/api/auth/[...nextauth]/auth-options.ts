// app/api/auth/[...nextauth]/auth-options.ts
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import type { JWT } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // <– TEMP: prints helpful logs on server

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[auth] missing credentials')
            return null
          }

          console.log('[auth] lookup user by email:', credentials.email)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { role: true },
          })

          if (!user) {
            console.log('[auth] user not found')
            return null
          }
          if (!user.password) {
            console.log('[auth] user has no password set')
            return null
          }

          const ok = await compare(credentials.password, user.password)
          console.log('[auth] password match:', ok)
          if (!ok) return null

          if (user.status !== 'ACTIVE') {
            console.log('[auth] user not ACTIVE, status=', user.status)
            return null
          }

          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
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

          console.log('[auth] authorize success for', user.email)
          return authUser
        } catch (e) {
          console.error('[auth] authorize error', e)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as NextAuthUser & {
          avatar?: string | null
          roleId?: string | null
          roleName?: string | null
          status?: string
        }
        if (!token.id && typeof (u as { id?: unknown }).id === 'string') {
          token.id = (u as unknown as { id: string }).id
        }
        token.email = u.email ?? token.email
        token.name = u.name ?? token.name
        token.avatar = u.avatar ?? null
        token.roleId = u.roleId ?? null
        token.roleName = u.roleName ?? null
        token.status = u.status ?? token.status ?? 'INACTIVE'
      }
      return token as JWT
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id
        session.user.email = (token.email as string) ?? session.user.email
        session.user.name = (token.name as string) ?? session.user.name
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

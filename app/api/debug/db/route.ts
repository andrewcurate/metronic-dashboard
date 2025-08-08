import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.user.count()
    const user = await prisma.user.findUnique({
      where: { email: 'andrew@curatehealth.co.uk' },
      select: { id: true, email: true, status: true, password: true, roleId: true }
    })

    return NextResponse.json({
      ok: true,
      envHasDbUrl: Boolean(process.env.DATABASE_URL),
      dbUrlHostHint: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? null,
      userCount: count,
      foundUser: Boolean(user),
      userPreview: user
        ? { email: user.email, status: user.status, roleId: user.roleId, pwLen: user.password?.length ?? 0 }
        : null,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, envHasDbUrl: Boolean(process.env.DATABASE_URL) },
      { status: 500 }
    )
  }
}

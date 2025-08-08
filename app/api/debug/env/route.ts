import { NextResponse } from "next/server";

export async function GET() {
  const mask = (v?: string) =>
    !v ? v : v.length <= 8 ? "***" : v.slice(0, 4) + "..." + v.slice(-3);

  return NextResponse.json({
    ok: true,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL_present: Boolean(process.env.DATABASE_URL),
    DIRECT_URL_present: Boolean(process.env.DIRECT_URL),
    DATABASE_URL_preview: mask(process.env.DATABASE_URL),
    DIRECT_URL_preview: mask(process.env.DIRECT_URL),
  });
}

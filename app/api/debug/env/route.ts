import { NextResponse } from 'next/server';

export async function GET() {
  const db = process.env.DATABASE_URL || '';
  const masked =
    db
      .replace(/postgresql:\/\/([^:]+):([^@]+)@/i, 'postgresql://$1:***@')
      .replace(/(options=project%3D)[^&]+/i, '$1<ref>');
  return NextResponse.json({ hasDB: !!db, databaseUrlMasked: masked });
}

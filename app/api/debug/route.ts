// app/api/debug/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const k = process.env.OPENAI_API_KEY;
  return NextResponse.json({
    hasKey: Boolean(k),
    startsWith: k ? k.slice(0, 7) : null,
    env: process.env.VERCEL_ENV ?? 'local',
    // Helpful sanity checks:
    node: process.version,
    region: process.env.VERCEL_REGION ?? 'unknown',
  });
}

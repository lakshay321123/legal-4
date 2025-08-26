import { NextResponse } from 'next/server';

export async function GET() {
  const k = process.env.OPENAI_API_KEY;
  return NextResponse.json({
    hasKey: !!k,
    sample: k ? `length=${k.length}, startsWith=${k.slice(0,7)}` : null,
    env: process.env.VERCEL_ENV ?? 'unknown'
  });
}

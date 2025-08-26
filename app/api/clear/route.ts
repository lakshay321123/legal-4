// app/api/clear/route.ts
import { NextResponse } from 'next/server';
import { clearContext } from '@/lib/memory';

function ipOf(req: Request) {
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return fwd || 'anon';
}

export async function POST(req: Request) {
  const ip = ipOf(req);
  clearContext(ip);
  return NextResponse.json({ ok: true });
}

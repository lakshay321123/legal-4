import { NextResponse } from 'next/server';
import { clearContext } from '@/lib/memory';

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  try { clearContext(ip); } catch {}
  return NextResponse.json({ ok: true });
}

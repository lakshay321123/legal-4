// app/api/models/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });

    const text = await res.text();
    // Return a short list (top 30) so it renders in browser
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      bodySnippet: text.slice(0, 2000),
      hint: 'Search for "gpt-4o", "gpt-4o-mini", or "gpt-3.5-turbo" in this snippet.',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

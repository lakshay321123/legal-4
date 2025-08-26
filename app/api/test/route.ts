// app/api/test/route.ts
import { NextResponse } from 'next/server';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'; // override via env if you like

export async function GET() {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hi in one short sentence.' },
        ],
        max_tokens: 50,
        temperature: 0.2,
      }),
    });

    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      modelTried: DEFAULT_MODEL,
      bodySnippet: text.slice(0, 600),
      hint: res.ok
        ? 'Model works. Put this model in your /api/answer route.'
        : 'If status is 404 -> model_not_found; 401 -> bad key; 429 -> rate/usage limit.',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

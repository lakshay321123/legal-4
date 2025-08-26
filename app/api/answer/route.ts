// app/api/answer/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: '❌ Server missing OPENAI_API_KEY.' }, { status: 500 });
    }
    if (!q.trim()) {
      return NextResponse.json({ answer: 'Please type a question.' }, { status: 400 });
    }

    const system =
      mode === 'lawyer'
        ? 'You are a precise legal research assistant for lawyers. Keep it concise, cite authorities when helpful.'
        : 'You explain legal topics for regular citizens in simple language and short paragraphs. Add "Not legal advice." at the end.';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: q },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('OpenAI error:', res.status, text);
      return NextResponse.json({ answer: `⚠️ OpenAI request failed (${res.status}).` }, { status: 500 });
    }

    const data = await res.json();
    let answer = data?.choices?.[0]?.message?.content ?? 'No answer generated.';
    if (mode === 'citizen') answer += '\n\n⚠️ Informational only — not a substitute for advice from a licensed advocate.';
    return NextResponse.json({ answer, sources: [] });
  } catch (err) {
    console.error('answer route error', err);
    return NextResponse.json({ answer: '⚠️ Something went wrong. Try again.' }, { status: 500 });
  }
}

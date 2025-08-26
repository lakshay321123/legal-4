// app/api/answer/route.ts
import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT_CITIZEN, SYSTEM_PROMPT_LAWYER, isGreeting, looksVague, DISCLAIMER } from '@/lib/prompt';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: '❌ Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables.' }, { status: 500 });
    }
    if (!q.trim()) {
      return NextResponse.json({ answer: 'Please type a question. For example: "How to file an RTI in India?"' }, { status: 400 });
    }

    // Greeting → friendly, no API spend
    if (isGreeting(q)) {
      const suggestions = [
        'How to draft a basic rent agreement?',
        'What is Article 21 and why is it important?',
        'Process to file a consumer complaint online',
        'Bail basics: types and common conditions'
      ];
      const lines = [
        `👋 ${mode === 'lawyer' ? 'Ready for research. Paste facts or provisions.' : 'I can explain legal topics in simple language.'}`,
        mode === 'lawyer'
          ? 'Try: “Key Supreme Court cases on anticipatory bail (Section 438 CrPC)”'
          : 'Try: “How to send a legal notice for unpaid salary?”',
        '',
        'Popular: ',
        ...suggestions.map((s) => `• ${s}`)
      ];
      return NextResponse.json({ answer: lines.join('\n') });
    }

    // Looks vague → ask quick clarifying questions
    if (looksVague(q)) {
      const followups = mode === 'lawyer'
        ? ['Jurisdiction & forum?', 'Relevant statutes/sections (if known)?', 'Timeline or key facts (brief)?']
        : ['Which city/state applies?', 'Is this civil (money/contract) or criminal?', 'Any deadlines or documents already filed?'];
      const msg = [
        "I can help better with a bit more detail:",
        ...followups.map((f) => `• ${f}`),
        '',
        'Or ask something like: "Steps to file police complaint for lost documents in Delhi."'
      ].join('\n');
      return NextResponse.json({ answer: msg });
    }

    // Compose tone
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;

    // Call OpenAI via fetch (portable)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: q }
        ],
        max_tokens: 700
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('OpenAI error:', res.status, text);
      return NextResponse.json({ answer: `⚠️ Couldn’t generate an answer (error ${res.status}). Please try again.` }, { status: 500 });
    }

    const data = await res.json();
    let answer: string = data?.choices?.[0]?.message?.content ?? 'No answer generated.';
    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;

    return NextResponse.json({ answer, sources: [] });
  } catch (err) {
    console.error('answer route error', err);
    return NextResponse.json({ answer: '⚠️ Something went wrong. Please try again.' }, { status: 500 });
  }
}

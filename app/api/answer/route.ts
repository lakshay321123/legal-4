// app/api/answer/route.ts
import { NextResponse } from 'next/server';

/** -----------------------------
 *  Prompts & helpers
 *  ----------------------------- */
const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Use simple words, short paragraphs, step-by-step explanations, avoid legalese.
Add a short "Not legal advice." line at the end.
If the question is vague, ask 1–2 quick clarifying questions first.
`;

const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Structure: 1) Issues 2) Rules/Authorities (cite concisely) 3) Analysis 4) Practical Notes.
Ask for missing key facts if needed.
Keep it tight and neutral.
`;

function isGreeting(text: string) {
  const s = text.toLowerCase().trim();
  return ['hi','hello','hey','namaste','good morning','good afternoon','good evening'].some(w => s.startsWith(w));
}

function looksVague(text: string) {
  const s = text.toLowerCase();
  return s.length < 6
    || (/help|law|legal|case|section|advise|advice|problem/.test(s) && !/\d{3,4}|article|section|ipc|crpc|contract|gst|divorce|bail|notice|rti|consumer|writ|fir/.test(s));
}

const MODEL = 'gpt-4o-mini';
const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

/** -----------------------------
 *  Main handler
 *  ----------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';

    // 1) Key check
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          answer: '❌ Server missing OPENAI_API_KEY.',
          detail: 'Set it in Vercel → Project → Settings → Environment Variables → add OPENAI_API_KEY → Redeploy.',
        },
        { status: 500 }
      );
    }

    // 2) Input check
    if (!q.trim()) {
      return NextResponse.json(
        { answer: 'Please type a question. Example: "How to file an RTI in India?"' },
        { status: 400 }
      );
    }

    // 3) No-cost friendly paths (don’t call OpenAI unless needed)
    if (isGreeting(q)) {
      const suggestions = [
        'How to draft a basic rent agreement?',
        'What is Article 21 and why is it important?',
        'Process to file a consumer complaint online',
        'Bail basics: types and common conditions',
      ];
      const lines = [
        `👋 ${mode === 'lawyer' ? 'Ready for research. Paste facts or provisions.' : 'I can explain legal topics in simple language.'}`,
        mode === 'lawyer'
          ? 'Try: “Key Supreme Court cases on anticipatory bail (Section 438 CrPC)”'
          : 'Try: “How to send a legal notice for unpaid salary?”',
        '',
        'Popular:',
        ...suggestions.map((s) => `• ${s}`),
      ];
      return NextResponse.json({ answer: lines.join('\n') });
    }

    if (looksVague(q)) {
      const followups = mode === 'lawyer'
        ? ['Jurisdiction & forum?', 'Relevant statutes/sections (if known)?', 'Timeline or key facts (brief)?']
        : ['Which city/state applies?', 'Is this civil (money/contract) or criminal?', 'Any deadlines or documents already filed?'];
      const msg = [
        'I can help better with a bit more detail:',
        ...followups.map((f) => `• ${f}`),
        '',
        'Or ask something like: "Steps to file police complaint for lost documents in Delhi."',
      ].join('\n');
      return NextResponse.json({ answer: msg });
    }

    // 4) Compose prompt & call OpenAI
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: q },
        ],
      }),
    });

    // 5) If OpenAI returns an error, surface the REAL reason (to help you debug)
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Log full details to server logs
      console.error('[OpenAI error]', res.status, res.statusText, text);

      // Show a helpful message to the user + include a short diagnostic
      let hint = 'See diagnostic details below.';
      if (res.status === 401) hint = '401 Unauthorized: wrong/revoked key, or org/project mismatch.';
      if (res.status === 429) hint = '429 Rate limited: hit RPM/TPM or monthly hard limit in OpenAI.';
      if (res.status === 404) hint = '404 Model not found: check model name or access.';

      return NextResponse.json(
        {
          answer: `⚠️ OpenAI request failed (${res.status}). ${hint}`,
          diagnostic: {
            status: res.status,
            statusText: res.statusText,
            bodySnippet: text.slice(0, 400), // enough to identify the cause
            modelTried: MODEL,
          },
        },
        { status: 500 }
      );
    }

    // 6) Success
    const data = await res.json();
    let answer: string = data?.choices?.[0]?.message?.content ?? 'No answer generated.';
    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;

    return NextResponse.json({ answer, sources: [] });
  } catch (err: any) {
    // Show real error to you in logs + helpful message to the user
    console.error('[answer route error]', err?.message || err, err?.stack);
    return NextResponse.json(
      {
        answer: '⚠️ Server error while contacting OpenAI.',
        diagnostic: { message: String(err?.message || err) },
      },
      { status: 500 }
    );
  }
}

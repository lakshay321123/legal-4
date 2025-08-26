// app/api/answer/route.ts
import { NextResponse } from 'next/server';

/** ===============================
 * Prompts & small helpers
 * =============================== */
const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Use simple words, short paragraphs, step-by-step explanations, avoid legalese.
Add a short "Not legal advice." line at the end.
If the question is vague, ask 1–2 quick clarifying questions first.
`;

const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Structure: 1) Issues 2) Rules/Authorities (cite concisely) 3) Analysis 4) Practical Notes.
Ask for missing key facts if needed. Keep it tight and neutral.
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

const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

// Config you can tweak via ENV without editing code
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();      // 'gemini' | 'openai'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/** ===============================
 * Light per-IP rate limit (4 req / 10s)
 * =============================== */
type Bucket = { ts: number[] };
const RL_WINDOW_MS = 10_000;
const RL_MAX = 4;
const ipBuckets: Map<string, Bucket> = new Map();
function ipOf(req: Request) {
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return fwd || 'anon';
}
function rateLimited(ip: string) {
  const now = Date.now();
  const b = ipBuckets.get(ip) ?? { ts: [] };
  b.ts = b.ts.filter(t => now - t < RL_WINDOW_MS);
  if (b.ts.length >= RL_MAX) { ipBuckets.set(ip, b); return true; }
  b.ts.push(now); ipBuckets.set(ip, b); return false;
}

/** ===============================
 * Gemini call (generateContent)
 * =============================== */
async function callGemini(apiKey: string, model: string, system: string, userQ: string) {
  // Gemini uses the "contents" format. We put the system prompt as an initial part.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Keep temperature/token small-ish at first to avoid quotas
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: system.trim() }] },
        { role: 'user', parts: [{ text: userQ }] }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700
      }
    }),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // Surface the reason to help you debug quotas or model access
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text);
  // Gemini returns candidates[0].content.parts[].text
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const answer = parts.map((p: any) => p?.text ?? '').join('').trim() || 'No answer generated.';
  return answer;
}

/** ===============================
 * OpenAI call (fallback if you keep it)
 * =============================== */
async function callOpenAI(apiKey: string, model: string, system: string, userQ: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userQ },
      ],
    }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = JSON.parse(text);
  const answer = data?.choices?.[0]?.message?.content ?? 'No answer generated.';
  return answer;
}

/** ===============================
 * Main handler
 * =============================== */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';

    // Input check
    if (!q.trim()) {
      return NextResponse.json({ answer: 'Please type a question.' }, { status: 400 });
    }

    // Soft rate limit
    const ip = ipOf(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { answer: '⏳ You’re sending messages too quickly. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }

    // Free greeting / clarify without spending tokens
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

    // Choose provider + compose prompt
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;

    let answer: string;
    if (PROVIDER === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { answer: '❌ Missing GEMINI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
          { status: 500 }
        );
      }
      answer = await callGemini(key, GEMINI_MODEL, system, q);
    } else {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { answer: '❌ Missing OPENAI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
          { status: 500 }
        );
      }
      answer = await callOpenAI(key, OPENAI_MODEL, system, q);
    }

    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;
    return NextResponse.json({ answer, sources: [] });
  } catch (err: any) {
    console.error('[answer route error]', err?.message || err, err?.stack);
    // Show a short diagnostic to help you fix quotas or access quickly
    return NextResponse.json(
      {
        answer: '⚠️ Error contacting AI provider.',
        diagnostic: String(err?.message || err).slice(0, 500)
      },
      { status: 500 }
    );
  }
}

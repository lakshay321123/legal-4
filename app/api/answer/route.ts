// app/api/answer/route.ts
import { NextResponse } from 'next/server';
import { getContext, updateContext, extractContextBits, summarizeContext } from '@/lib/memory';

/** ===============================
 * Prompts & small helpers
 * =============================== */
const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Use simple words, short paragraphs, step-by-step explanations, avoid legalese.
Add a short "Not legal advice." line at the end.
If the question is vague, ask 1–2 quick clarifying questions first (ONLY if those details are not provided in the context below).
Always respect and use the provided CONTEXT if present, and do not ask again for what is already given.
`;

const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Structure: 1) Issues 2) Rules/Authorities (cite concisely) 3) Analysis 4) Practical Notes.
Ask for missing key facts only if they are not present in the CONTEXT below.
Prefer Indian law if not specified otherwise.
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

const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

// Config via ENV
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
async function callGemini(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string) {
  const sys = system.trim() + (ctxSummary ? `\n\nCONTEXT (authoritative, do not re-ask): ${ctxSummary}` : '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: sys }] },
        { role: 'user', parts: [{ text: userQ }] }
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 }
    }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text ?? '').join('').trim() || 'No answer generated.';
}

/** ===============================
 * OpenAI call (fallback if you keep it)
 * =============================== */
async function callOpenAI(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string) {
  const sys = system.trim() + (ctxSummary ? `\n\nCONTEXT (authoritative, do not re-ask): ${ctxSummary}` : '');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userQ },
      ],
    }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);
  return data?.choices?.[0]?.message?.content ?? 'No answer generated.';
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

    // Rate limit
    const ip = ipOf(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { answer: '⏳ You’re sending messages too quickly. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }

    // Greeting (no cost)
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

    // ===== Context memory: extract + update =====
    const prev = getContext(ip);
    const bits = extractContextBits(q);
    const ctx = updateContext(ip, bits);

    // If user intent looks like “rent agreement”, ensure ctx.intent is set
    if (!ctx.intent && /\brent\s+agreement|rental\s+agreement|lease\s+agreement\b/i.test(q)) {
      updateContext(ip, { intent: 'rent_agreement' });
    }

    // Ask only for missing pieces (once)
    const needsCityOrState = !ctx.city && !ctx.state;
    const needsProperty = (ctx.intent === 'rent_agreement') && !ctx.property;

    if (looksVague(q) || needsCityOrState || needsProperty) {
      const missing: string[] = [];
      if (needsCityOrState) missing.push('Which city/state applies?');
      if (needsProperty) missing.push('What kind of property (house, apartment, shop, office, land)?');

      if (missing.length) {
        return NextResponse.json({
          answer:
            'Got it. To tailor the answer correctly, please confirm:\n' +
            missing.map(m => `• ${m}`).join('\n'),
        });
      }
    }

    // Build system prompt with authoritative CONTEXT so the model doesn't re-ask
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;
    const ctxSummary = summarizeContext(getContext(ip)); // re-read after updates

    // Call provider
    let answer: string;
    if (PROVIDER === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { answer: '❌ Missing GEMINI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
          { status: 500 }
        );
      }
      answer = await callGemini(key, GEMINI_MODEL, system, q, ctxSummary);
    } else {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { answer: '❌ Missing OPENAI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
          { status: 500 }
        );
      }
      answer = await callOpenAI(key, OPENAI_MODEL, system, q, ctxSummary);
    }

    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;
    return NextResponse.json({ answer, context: getContext(ip), sources: [] });
  } catch (err: any) {
    console.error('[answer route error]', err?.message || err, err?.stack);
    return NextResponse.json(
      { answer: '⚠️ Error contacting AI provider.', diagnostic: String(err?.message || err).slice(0, 500) },
      { status: 500 }
    );
  }
}

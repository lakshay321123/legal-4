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

const MODEL = 'gpt-4o-mini';
const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

/** -----------------------------
 *  Soft per-IP rate limit (4 req / 10s)
 *  ----------------------------- */
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

/** -----------------------------
 *  Simple 10-minute answer cache
 *  ----------------------------- */
type CacheEntry = { answer: string; until: number };
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
function keyFor(q: string, mode: 'citizen'|'lawyer') {
  const cleaned = q.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${mode}:${cleaned}`;
}
function getCached(k: string) {
  const e = cache.get(k);
  if (e && e.until > Date.now()) return e.answer;
  if (e) cache.delete(k);
  return null;
}
function setCached(k: string, answer: string) {
  cache.set(k, { answer, until: Date.now() + CACHE_TTL_MS });
}

/** -----------------------------
 *  Retry logic for OpenAI 429s
 *  ----------------------------- */
const MAX_RETRIES = 3;
const MIN_BACKOFF = 800;   // ms
const MAX_BACKOFF = 5000;  // ms
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callOpenAI(apiKey: string, system: string, userQ: string) {
  let last = '';
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 550, // slightly lower to cut usage
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userQ }
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? 'No answer generated.';
    }

    const txt = await res.text().catch(() => '');
    last = `status=${res.status} body=${txt.slice(0, 400)}`;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get('retry-after');
      let waitMs =
        retryAfter && /^\d+$/.test(retryAfter)
          ? Math.min(parseInt(retryAfter, 10) * 1000, MAX_BACKOFF)
          : Math.min(MIN_BACKOFF * Math.pow(2, attempt - 1), MAX_BACKOFF);
      await sleep(waitMs);
      continue;
    }

    throw new Error(last);
  }
  throw new Error(`429 after retries: ${last}`);
}

/** -----------------------------
 *  Main handler
 *  ----------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: '❌ Server missing OPENAI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
        { status: 500 }
      );
    }
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

    // Free paths
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

    // Cache
    const ck = keyFor(q, mode);
    const cached = getCached(ck);
    if (cached) {
      return NextResponse.json({ answer: cached, sources: [], cached: true });
    }

    // Call OpenAI with retry/backoff
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;
    let answer = await callOpenAI(apiKey, system, q);
    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;

    setCached(ck, answer);
    return NextResponse.json({ answer, sources: [] });
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error('[answer route error]', msg);
    const is429 = /(^|[^0-9])429([^0-9]|$)/.test(msg);
    if (is429) {
      return NextResponse.json(
        { answer: '⚠️ Heavy traffic right now. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { answer: '⚠️ Server error while contacting OpenAI.' },
      { status: 500 }
    );
  }
}

// app/api/answer/route.ts
import { NextResponse } from 'next/server';

/** -----------------------------
 *  Friendly prompts / helpers
 *  ----------------------------- */
const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Style: simple words, short paragraphs, step-by-step, no legalese.
Add a brief "Not legal advice" line at the end.
If the question is vague or incomplete, ask 1–2 short clarifying questions before answering.
Keep answers within 8–12 sentences unless asked for depth.
`;

const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Output sections:
1) Issues
2) Rules/Authorities (cite provisions/cases concisely)
3) Analysis (tight, bullet-y)
4) Practical Notes
If the question lacks key facts, ask targeted clarifying questions first.
Limit to 12–16 sentences unless asked to expand.
`;

const DISCLAIMER = "⚠️ Informational only — not a substitute for advice from a licensed advocate.";

function isGreeting(text: string) {
  const s = text.toLowerCase().trim();
  return ['hi','hello','hey','namaste','good morning','good afternoon','good evening'].some(w => s.startsWith(w));
}

function looksVague(text: string) {
  const s = text.toLowerCase();
  return s.length < 6
    || (/help|law|legal|case|section|advise|advice|problem/.test(s) && !/\d{3,4}|article|section|ipc|crpc|contract|gst|divorce|bail|notice|rti|consumer|writ|fir/.test(s));
}

/** -----------------------------
 *  Basic per-IP rate limit (best-effort)
 *  Limits to 6 requests / minute / IP
 *  Note: serverless instances are ephemeral; this is a soft guard.
 *  ----------------------------- */
type Bucket = { ts: number[] }; // request timestamps (ms)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const ipBuckets: Map<string, Bucket> = new Map();

function getIp(req: Request) {
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return fwd || 'anon';
}

function rateLimited(ip: string) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? { ts: [] };
  // drop old timestamps
  bucket.ts = bucket.ts.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (bucket.ts.length >= RATE_LIMIT_MAX) {
    ipBuckets.set(ip, bucket);
    return true;
  }
  bucket.ts.push(now);
  ipBuckets.set(ip, bucket);
  return false;
}

/** -----------------------------
 *  Retry logic for OpenAI 429s
 *  ----------------------------- */
const MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function callOpenAI(apiKey: string, system: string, userQ: string) {
  let lastErrText = '';
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userQ },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? 'No answer generated.';
    }

    // Not OK
    const status = res.status;
    const text = await res.text().catch(() => '');
    lastErrText = `status=${status} body=${text}`;

    // Handle 429 with backoff
    if (status === 429 && attempt < MAX_RETRIES) {
      // Respect Retry-After if present; otherwise exponential backoff
      const retryAfterHeader = res.headers.get('retry-after');
      let waitMs = 0;
      if (retryAfterHeader && /^\d+$/.test(retryAfterHeader)) {
        waitMs = Math.min(parseInt(retryAfterHeader, 10) * 1000, 10_000);
      } else {
        waitMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s
      }
      await sleep(waitMs);
      continue;
    }

    // Other status codes → break and surface error
    throw new Error(`OpenAI error: ${lastErrText}`);
  }

  // Exhausted retries
  throw new Error(`OpenAI 429 after retries: ${lastErrText}`);
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
        { answer: '❌ Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables.' },
        { status: 500 }
      );
    }
    if (!q.trim()) {
      return NextResponse.json(
        { answer: 'Please type a question. For example: "How to file an RTI in India?"' },
        { status: 400 }
      );
    }

    // Soft per-IP rate limit to avoid hammering the API
    const ip = getIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { answer: '⏳ You are sending too many requests. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }

    // Greeting path (free, no API call)
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

    // Clarify vague questions without calling OpenAI
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

    // Compose the system prompt
    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;

    // Call OpenAI with retry on 429
    let answer = await callOpenAI(apiKey, system, q);
    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;

    return NextResponse.json({ answer, sources: [] });
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error('answer route error:', msg);

    if (/429/.test(msg)) {
      return NextResponse.json(
        { answer: '⚠️ We’re getting a lot of traffic right now. Please wait a few seconds and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { answer: '⚠️ Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

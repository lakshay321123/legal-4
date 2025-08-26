// app/api/answer/route.ts
import { NextResponse } from 'next/server';
import {
  getContext, updateContext, extractContextBits, summarizeContext,
  jaccardSimilarity, type Topic
} from '@/lib/memory';

/** ===============================
 * Prompts & helpers
 * =============================== */
const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Use simple words, short paragraphs, step-by-step explanations, avoid legalese.
If the question is vague, ask 1–2 quick clarifying questions ONLY if those details are NOT provided in CONTEXT or DOCS.
Use Indian law by default unless otherwise stated.
End with: "Not legal advice." (one line).
Deliver clean, actionable steps, not internal reasoning.
`;

const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Output sections: 1) Issues 2) Rules/Authorities (short cites) 3) Analysis 4) Practical Notes.
Ask for missing key facts only if they are NOT present in CONTEXT or DOCS.
Prefer Indian law unless the jurisdiction is explicit.
Deliver crisp, professional writing (no internal step-by-step reasoning).
`;

const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

function isGreeting(text: string) {
  const s = text.toLowerCase().trim();
  return ['hi','hello','hey','namaste','good morning','good afternoon','good evening'].some(w => s.startsWith(w));
}
function looksVague(text: string) {
  const s = text.toLowerCase();
  return s.length < 6
    || (/help|law|legal|case|section|advise|advice|problem/.test(s) && !/\d{3,4}|article|section|ipc|crpc|contract|gst|divorce|bail|notice|rti|consumer|writ|fir/.test(s));
}
function ipOf(req: Request) {
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return fwd || 'anon';
}

/** Topic classifier */
type T = Topic;
function classifyTopic(q: string): T {
  const s = q.toLowerCase();
  if (/\brent\b|\brental\b|\blease\b/.test(s)) return 'rent_agreement';
  if (/\blegal\s+notice\b/.test(s)) return 'legal_notice';
  if (/\bconsumer\s+complaint|\bncdrc|\bdcdrc\b/.test(s)) return 'consumer';
  if (/\barticle\s+\d+|fundamental\s+rights|constitution\b/.test(s)) return 'constitution';
  if (/\bipc|crpc|fir|bail|charge\s*sheet|arrest|police\b/.test(s)) return 'criminal';
  if (/\bcase\s+law|leading\s+cases|landmark\s+cases|citation\b/.test(s)) return 'case_law';
  if (/\bcases?\s+.*\b(on|against)\b/i.test(q)) return 'criminal';
  return 'other';
}

/** Rate limit (soft): 4 req / 10s per IP */
type Bucket = { ts: number[] };
const RL_WINDOW_MS = 10_000;
const RL_MAX = 4;
const ipBuckets: Map<string, Bucket> = new Map();
function rateLimited(ip: string) {
  const now = Date.now();
  const b = ipBuckets.get(ip) ?? { ts: [] };
  b.ts = b.ts.filter(t => now - t < RL_WINDOW_MS);
  if (b.ts.length >= RL_MAX) { ipBuckets.set(ip, b); return true; }
  b.ts.push(now); ipBuckets.set(ip, b); return false;
}

// ENV config
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();      // 'gemini' | 'openai'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/** Provider callers */
async function callGemini(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string, docsText?: string) {
  const sys = system.trim()
    + (ctxSummary ? `\n\nCONTEXT (authoritative): ${ctxSummary}` : '')
    + (docsText ? `\n\nDOCS (verbatim user-provided excerpts):\n${docsText}` : '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: sys }] },
        { role: 'user', parts: [{ text: userQ }] }
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
    }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text ?? '').join('').trim() || 'No answer generated.';
}
async function callOpenAI(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string, docsText?: string) {
  const sys = system.trim()
    + (ctxSummary ? `\n\nCONTEXT (authoritative): ${ctxSummary}` : '')
    + (docsText ? `\n\nDOCS (verbatim user-provided excerpts):\n${docsText}` : '');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
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

/** Main handler */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';
    const docs: Array<{ name: string; type: string; text: string }> = Array.isArray(body.docs) ? body.docs : [];

    if (!q.trim()) return NextResponse.json({ answer: 'Please type a question.' }, { status: 400 });

    const ip = ipOf(req);
    if (rateLimited(ip)) {
      return NextResponse.json({ answer: '⏳ You’re sending messages too quickly. Please wait a few seconds and try again.' }, { status: 429 });
    }

    if (isGreeting(q)) {
      const suggestions = [
        'Draft a rent agreement for a Delhi apartment (essentials + clauses).',
        'Explain Article 21 with 2 key cases.',
        'Steps to file a consumer complaint online (India).',
        'Bail basics: types and common conditions.',
      ];
      const lines = [
        `👋 ${mode === 'lawyer' ? 'Ready for research. Paste facts or provisions.' : 'I can explain legal topics in simple language.'}`,
        '',
        'Quick starts:',
        ...suggestions.map(s => `• ${s}`),
      ];
      return NextResponse.json({ answer: lines.join('\n') });
    }

    // Topic detection + context switching (smart)
    const prev = getContext(ip);
    const newTopic = classifyTopic(q);
    const prevTopic = prev.topic;

    // Similarity guard to avoid accidental resets: if text is very similar, keep context
    const sim = prev.lastQ ? jaccardSimilarity(prev.lastQ, q) : 0;
    const topicChanged = prevTopic && newTopic && newTopic !== prevTopic && sim < 0.25;

    if (topicChanged) {
      updateContext(ip, { intent: undefined, city: undefined, state: undefined, property: undefined, extras: [] });
    }

    // Update context with new bits + topic + lastQ
    const bits = extractContextBits(q);
    updateContext(ip, { ...bits, topic: newTopic, lastQ: q });

    const ctx = getContext(ip);
    if (!ctx.intent) {
      if (newTopic === 'rent_agreement') updateContext(ip, { intent: 'rent_agreement' });
      else if (newTopic === 'legal_notice') updateContext(ip, { intent: 'legal_notice' });
    }

    // Only ask for missing pieces WHEN the current topic truly needs them
    const needsCityOrState = !ctx.city && !ctx.state && (ctx.intent === 'rent_agreement');
    const needsProperty = (ctx.intent === 'rent_agreement') && !ctx.property;

    if (looksVague(q) || needsCityOrState || needsProperty) {
      const missing: string[] = [];
      if (needsCityOrState) missing.push('Which city/state applies?');
      if (needsProperty) missing.push('What kind of property (house, apartment, shop, office, land)?');
      if (missing.length) {
        return NextResponse.json({ answer: 'Got it. To tailor the answer correctly, please confirm:\n' + missing.map(m => `• ${m}`).join('\n') });
      }
    }

    // Prepare DOCS (limit size per doc to keep tokens sane)
    const docsText = docs.length
      ? docs.map((d, i) => `# ${i + 1}. ${d.name}\n${(d.text || '').slice(0, 8000)}`).join('\n\n')
      : '';

    const system = mode === 'lawyer' ? SYSTEM_PROMPT_LAWYER : SYSTEM_PROMPT_CITIZEN;
    const ctxSummary = summarizeContext(getContext(ip));

    // Call provider
    let answer: string;
    if ((process.env.AI_PROVIDER || 'gemini').toLowerCase() === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ answer: '❌ Missing GEMINI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' }, { status: 500 });
      answer = await callGemini(key, process.env.GEMINI_MODEL || 'gemini-1.5-flash', system, q, ctxSummary, docsText);
    } else {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ answer: '❌ Missing OPENAI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' }, { status: 500 });
      answer = await callOpenAI(key, process.env.OPENAI_MODEL || 'gpt-4o', system, q, ctxSummary, docsText);
    }

    if (mode === 'citizen') answer += `\n\n${DISCLAIMER}`;
    return NextResponse.json({ answer, context: getContext(ip) });
  } catch (err: any) {
    console.error('[answer route error]', err?.message || err, err?.stack);
    return NextResponse.json({ answer: '⚠️ Error contacting AI provider.', diagnostic: String(err?.message || err).slice(0, 500) }, { status: 500 });
  }
}

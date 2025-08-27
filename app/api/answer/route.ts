import { NextResponse } from 'next/server';
import { getContext, updateContext, extractContextBits, summarizeContext } from '@/lib/memory';
import type { SearchResult } from '@/lib/multi-search';

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

const DISCLAIMER = '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

// env
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// ===== Provider calls
async function callGemini(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string, docBits?: string) {
  const sys = system.trim()
    + (ctxSummary ? `\n\nCONTEXT (authoritative): ${ctxSummary}` : '')
    + (docBits ? `\n\nATTACHED_DOCS (extracts): ${docBits}` : '');
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

async function callOpenAI(apiKey: string, model: string, system: string, userQ: string, ctxSummary?: string, docBits?: string) {
  const sys = system.trim()
    + (ctxSummary ? `\n\nCONTEXT (authoritative): ${ctxSummary}` : '')
    + (docBits ? `\n\nATTACHED_DOCS (extracts): ${docBits}` : '');
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

// Intent helpers
function intentFrom(text: string): 'rent_agreement' | 'other' {
  const s = text.toLowerCase();
  return /\brent\s+agreement|rental\s+agreement|lease\s+agreement\b/.test(s)
    ? 'rent_agreement'
    : 'other';
}
function smallExtract(s: string, max = 1200) {
  // take first 1200 chars of each doc text (already truncated server-side)
  return s.length > max ? s.slice(0, max) + ' …' : s;
}

function summarizeWeb(results: SearchResult[], max = 5) {
  return results.slice(0, max).map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join('\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q: string = (body.q ?? '').toString();
    const mode: 'citizen' | 'lawyer' = body.mode === 'lawyer' ? 'lawyer' : 'citizen';
    const docs: Array<{ name: string; type: string; text: string }> = Array.isArray(body.docs) ? body.docs : [];
    const webResults: SearchResult[] = Array.isArray(body.webResults) ? body.webResults : [];

    if (!q.trim()) {
      return NextResponse.json({ answer: 'Please type a question.' }, { status: 400 });
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';

    // greeting shortcut
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

    // context memory
    const bits = extractContextBits(q);
    updateContext(ip, bits);
    const ctx = getContext(ip);

    // Determine current intent from this question (topic switching protection)
    const intent = intentFrom(q);
    if (!ctx.intent || ctx.intent !== intent) {
      updateContext(ip, { intent });
    }

    // Ask ONLY for rent-agreement specific gaps
    if (intent === 'rent_agreement') {
      const needsCityOrState = !ctx.city && !ctx.state;
      const needsProperty = !ctx.property;
      if (needsCityOrState || needsProperty) {
        const missing: string[] = [];
        if (needsCityOrState) missing.push('Which city/state applies?');
        if (needsProperty) missing.push('What kind of property (house, apartment, shop, office, land)?');
        if (missing.length) {
          return NextResponse.json({ answer: 'Got it. To tailor the answer correctly, please confirm:\n' + missing.map(m => `• ${m}`).join('\n') });
        }
      }
    }

    const ctxSummary = summarizeContext(getContext(ip));

    // compact doc extracts
    const docBits = docs.length
      ? docs.map(d => `【${d.name}】\n${smallExtract(d.text)}`).join('\n\n')
      : '';

    const webSummary = webResults.length ? summarizeWeb(webResults) : '';
    const qWithWeb = webSummary ? `Web search results:\n${webSummary}\n\n${q}` : q;

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
      answer = await callGemini(key, GEMINI_MODEL, system, qWithWeb, ctxSummary, docBits);
    } else {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { answer: '❌ Missing OPENAI_API_KEY. Set it in Vercel → Settings → Environment Variables → Redeploy.' },
          { status: 500 }
        );
      }
      answer = await callOpenAI(key, OPENAI_MODEL, system, qWithWeb, ctxSummary, docBits);
    }

    if (mode === 'citizen') answer += `\n\n${'⚠️ Informational only — not a substitute for advice from a licensed advocate.'}`;
    const sources = webResults.slice(0, 3).map(r => ({ title: r.title, url: r.url }));
    return NextResponse.json({ answer, context: getContext(ip), sources });
  } catch (err: any) {
    console.error('[answer route error]', err?.message || err, err?.stack);
    return NextResponse.json(
      { answer: '⚠️ Error contacting AI provider.', diagnostic: String(err?.message || err).slice(0, 500) },
      { status: 500 }
    );
  }
}

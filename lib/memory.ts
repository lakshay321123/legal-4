// lib/memory.ts
// In-memory context store with topic + last question.
// NOTE: On serverless (Vercel), this resets when the function instance recycles.
// For persistence, later plug into a DB/Redis.

export type Topic =
  | 'rent_agreement'
  | 'legal_notice'
  | 'consumer'
  | 'constitution'
  | 'criminal'
  | 'case_law'
  | 'other';

export type Context = {
  intent?: 'rent_agreement' | 'legal_notice' | 'other';
  topic?: Topic;
  city?: string;
  state?: string;
  property?: 'house' | 'apartment' | 'shop' | 'office' | 'land' | 'other';
  lastQ?: string;
  extras?: string[];
  updatedAt?: number;
};

const memory = new Map<string, Context>();

export function getContext(userId: string): Context {
  return memory.get(userId) ?? {};
}

export function updateContext(userId: string, patch: Partial<Context>) {
  const prev = memory.get(userId) ?? {};
  const next: Context = { ...prev, ...patch, updatedAt: Date.now() };
  memory.set(userId, next);
  return next;
}

export function clearContext(userId: string) {
  memory.set(userId, { updatedAt: Date.now(), extras: [] });
}

const STATES = [
  'andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh',
  'jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland',
  'odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal',
  'delhi','jammu and kashmir','ladakh','puducherry','chandigarh','dadra and nagar haveli','daman and diu','andaman and nicobar islands','lakshadweep'
];

const PROPERTY_WORDS: Array<[Context['property'], RegExp]> = [
  ['house', /\b(house|villa|independent\s+house|residential)\b/i],
  ['apartment', /\b(apartment|flat|condo)\b/i],
  ['shop', /\b(shop|storefront|commercial)\b/i],
  ['office', /\b(office|workspace)\b/i],
  ['land', /\b(land|plot|site)\b/i],
];

export function extractContextBits(text: string): Partial<Context> {
  const s = text.toLowerCase();
  let intent: Context['intent'] | undefined;
  if (/\brent\s+agreement\b|\brental\s+agreement\b|\blease\s+agreement\b/.test(s)) intent = 'rent_agreement';
  else if (/\blegal\s+notice\b/.test(s)) intent = 'legal_notice';

  let city: string | undefined;
  let state: string | undefined;

  const inMatch = s.match(/\b(in|at|within)\s+([a-zA-Z\s]{2,30})\b/);
  if (inMatch) {
    const place = inMatch[2].trim();
    if (STATES.includes(place)) state = cap(place);
    else city = cap(place);
  }
  if (!city && /\bdelhi\b/.test(s)) city = 'Delhi';
  if (!state) {
    const found = STATES.find(st => s.includes(st));
    if (found) state = cap(found);
  }

  let property: Context['property'] | undefined;
  for (const [kind, rx] of PROPERTY_WORDS) if (rx.test(text)) { property = kind; break; }

  const bits: Partial<Context> = {};
  if (intent) bits.intent = intent;
  if (city) bits.city = city;
  if (state) bits.state = state;
  if (property) bits.property = property;
  return bits;
}

export function summarizeContext(ctx: Context): string {
  const parts: string[] = [];
  if (ctx.intent) parts.push(`Intent: ${ctx.intent === 'rent_agreement' ? 'Rent Agreement' : ctx.intent === 'legal_notice' ? 'Legal Notice' : 'General'}`);
  if (ctx.city) parts.push(`City: ${ctx.city}`);
  if (ctx.state) parts.push(`State/UT: ${ctx.state}`);
  if (ctx.property) parts.push(`Property: ${cap(ctx.property)}`);
  return parts.join(' · ');
}

export function jaccardSimilarity(a: string, b: string) {
  const tok = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length>2));
  const A = tok(a), B = tok(b);
  const inter = new Set([...A].filter(x => B.has(x)));
  const union = new Set([...A, ...B]);
  return union.size ? inter.size / union.size : 0;
}

function cap(s: string) { return s.replace(/\b[a-z]/g, m => m.toUpperCase()); }

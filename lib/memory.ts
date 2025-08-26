// lib/memory.ts
// Lightweight, in-memory context store + simple extractors.
// NOTE: On serverless (Vercel), this resets when the function instance is recycled.
// For persistence across instances, plug these into a DB/Redis later.

export type Context = {
  intent?: 'rent_agreement' | 'legal_notice' | 'other';
  city?: string;
  state?: string;
  property?: 'house' | 'apartment' | 'shop' | 'office' | 'land' | 'other';
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

/** ======== Extractors (very simple / regex-based) ======== */

const STATES = [
  'andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh',
  'jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland',
  'odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal',
  'delhi','jammu and kashmir','ladakh','puducherry','chandigarh','dadra and nagar haveli','daman and diu','andaman and nicobar islands','lakshadweep'
];

const PROPERTY_WORDS: Array<[Context['property'], RegExp]> = [
  ['house', /\b(house|villa|independent\s+house)\b/i],
  ['apartment', /\b(apartment|flat|condo)\b/i],
  ['shop', /\b(shop|storefront)\b/i],
  ['office', /\b(office|workspace)\b/i],
  ['land', /\b(land|plot|site)\b/i],
];

export function extractContextBits(text: string): Partial<Context> {
  const s = text.toLowerCase();

  // Intent
  let intent: Context['intent'] | undefined;
  if (/\brent\s+agreement\b|\brental\s+agreement\b|\blease\s+agreement\b/.test(s)) {
    intent = 'rent_agreement';
  } else if (/\blegal\s+notice\b/.test(s)) {
    intent = 'legal_notice';
  }

  // City / State (very naive heuristics)
  // Try "in <word(s)>" pattern first
  let city: string | undefined;
  let state: string | undefined;

  const inMatch = s.match(/\b(in|at|within)\s+([a-zA-Z\s]{2,30})\b/);
  if (inMatch) {
    const place = inMatch[2].trim();
    // If it matches a state list, set state, else city.
    if (STATES.includes(place)) state = capitalizeWords(place);
    else city = capitalizeWords(place);
  }

  // Direct “Delhi”, “Mumbai”, or a state mentioned anywhere
  if (!city && /\bdelhi\b/.test(s)) city = 'Delhi';
  if (!state) {
    const foundState = STATES.find(st => s.includes(st));
    if (foundState) state = capitalizeWords(foundState);
  }

  // Property type
  let property: Context['property'] | undefined;
  for (const [kind, rx] of PROPERTY_WORDS) {
    if (rx.test(text)) { property = kind; break; }
  }
  if (!property && /\bresidential\b/i.test(text)) property = 'house';
  if (!property && /\bcommercial\b/i.test(text)) property = 'shop';

  const bits: Partial<Context> = {};
  if (intent) bits.intent = intent;
  if (city) bits.city = city;
  if (state) bits.state = state;
  if (property) bits.property = property;
  return bits;
}

export function summarizeContext(ctx: Context): string {
  const parts: string[] = [];
  if (ctx.intent) {
    const t = ctx.intent === 'rent_agreement' ? 'Rent Agreement' :
              ctx.intent === 'legal_notice' ? 'Legal Notice' : 'General';
    parts.push(`Intent: ${t}`);
  }
  if (ctx.city) parts.push(`City: ${ctx.city}`);
  if (ctx.state) parts.push(`State/UT: ${ctx.state}`);
  if (ctx.property) parts.push(`Property: ${capitalizeWords(ctx.property)}`);
  return parts.join(' · ');
}

function capitalizeWords(s: string) {
  return s.replace(/\b[a-z]/g, m => m.toUpperCase());
}

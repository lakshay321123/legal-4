// lib/memory.ts
// Persistent user memory store (context + extracted facts + document embeddings).
// Data is stored per user/session in data/memory.json:
// {
//   "<userId>": {
//     context: { ...Context },
//     facts: ["fact1", "fact2"],
//     embeddings: { "docId": [0.1, 0.2, ...] }
//   }
// }

import fs from 'fs';
import path from 'path';

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
  extras?: string[]; // extracted facts
  updatedAt?: number;
};

export interface UserMemory {
  context: Context;
  facts: string[];
  embeddings: Record<string, number[]>; // docId -> embedding vector
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MEM_FILE = path.join(DATA_DIR, 'memory.json');

function loadStore(): Record<string, UserMemory> {
  try {
    const raw = fs.readFileSync(MEM_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const store: Record<string, UserMemory> = loadStore();

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MEM_FILE, JSON.stringify(store, null, 2));
}

export function getContext(userId: string): Context {
  return store[userId]?.context ?? {};
}

export function getUserMemory(userId: string): UserMemory {
  return store[userId] ?? { context: {}, facts: [], embeddings: {} };
}

export function updateContext(userId: string, patch: Partial<Context>) {
  const prev = store[userId]?.context ?? {};
  const next: Context = { ...prev, ...patch, updatedAt: Date.now() };
  const rec = store[userId] ?? { context: next, facts: [], embeddings: {} };
  rec.context = next;
  rec.facts = rec.context.extras ?? rec.facts; // keep extras synced
  store[userId] = rec;
  persist();
  return next;
}

export function addFacts(userId: string, facts: string[]) {
  if (!facts.length) return;
  const rec = store[userId] ?? { context: {}, facts: [], embeddings: {} };
  rec.facts.push(...facts);
  rec.context.updatedAt = Date.now();
  rec.context.extras = rec.facts;
  store[userId] = rec;
  persist();
}

export function saveEmbedding(userId: string, docId: string, embedding: number[]) {
  const rec = store[userId] ?? { context: {}, facts: [], embeddings: {} };
  rec.embeddings[docId] = embedding;
  rec.context.updatedAt = Date.now();
  store[userId] = rec;
  persist();
}

export function clearContext(userId: string) {
  if (store[userId]) {
    delete store[userId];
    persist();
  }
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

import fs from 'fs/promises';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'vector-store.json');

export type VectorRecord = {
  id: string;
  provider: string;
  embedding: number[];
  text: string;
  metadata: { name: string; type: string; chunk: number };
};

async function loadStore(): Promise<VectorRecord[]> {
  try {
    const txt = await fs.readFile(STORE_PATH, 'utf8').catch(() => '[]');
    return JSON.parse(txt) as VectorRecord[];
  } catch {
    return [];
  }
}

async function saveStore(data: VectorRecord[]) {
  await fs.writeFile(STORE_PATH, JSON.stringify(data), 'utf8');
}

export async function addToVectorStore(items: VectorRecord[]) {
  const data = await loadStore();
  data.push(...items);
  await saveStore(data);
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export async function queryVectorStore(provider: string, embedding: number[], k = 3) {
  const data = (await loadStore()).filter(r => r.provider === provider);
  const scored = data.map(r => ({ r, score: cosineSim(embedding, r.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(s => s.r);
}

// ===== Embedding helpers =====
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (PROVIDER === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Missing GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_EMBED_MODEL)}:batchEmbedContents?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(t => ({ content: { parts: [{ text: t }] } }))
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${text.slice(0, 200)}`);
    const data = JSON.parse(text);
    const embeds = data?.embeddings || data?.responses || [];
    return embeds.map((e: any) => e?.values || e?.embedding?.values || []);
  } else {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Missing OPENAI_API_KEY');
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: texts }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`OpenAI embed ${res.status}: ${text.slice(0, 200)}`);
    const data = JSON.parse(text);
    return (data?.data || []).map((d: any) => d.embedding as number[]);
  }
}

export function chunkText(text: string, size = 1000, overlap = 200) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export { PROVIDER };

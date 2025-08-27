const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function rewriteQuery(q: string): Promise<string> {
  const prompt = `Rewrite the following search query into a short, explicit search string focusing on key nouns and verbs. Respond with only the rewritten query.\n\nQuery: ${q}`;
  try {
    if (PROVIDER === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return q;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0,
          max_tokens: 20,
          messages: [
            { role: 'system', content: 'You rewrite search queries into concise search engine strings.' },
            { role: 'user', content: q }
          ],
        }),
      }).catch(() => null);
      const data = await res?.json().catch(() => ({}));
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || q;
    } else {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return q;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${key}`;
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 20 },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => null);
      const data = await res?.json().catch(() => ({}));
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p?.text ?? '').join('').trim();
      return text || q;
    }
  } catch {
    return q;
  }
}

export default rewriteQuery;

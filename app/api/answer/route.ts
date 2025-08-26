import { NextResponse } from 'next/server';

type SearchItem = { title: string; url: string; tag?: string };

async function bingSearch(query: string): Promise<SearchItem[]> {
  const key = process.env.BING_API_KEY;
  if (!key) {
    return [
      { title: "India Code — Search", url: "https://www.indiacode.nic.in/", tag: "Act" },
      { title: "e-Gazette of India", url: "https://egazette.nic.in/", tag: "Gazette" },
      { title: "Supreme Court of India — Judgments", url: "https://main.sci.gov.in/judgments", tag: "Judgment" }
    ];
  }
  const domainFilter = 'site:indiacode.nic.in OR site:egazette.nic.in OR site:sci.gov.in OR (site:gov.in "High Court")';
  const q = `${query} ${domainFilter}`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-IN&count=8&responseFilter=Webpages`;
  const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
  if (!r.ok) return [];
  const data = await r.json();
  const results: SearchItem[] = (data.webPages?.value || []).map((x: any) => ({
    title: x.name as string,
    url: x.url as string
  }));
  return results;
}

async function scrape(url: string): Promise<string> {
  try {
    const endpoint =
      process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/scrape`
        : 'http://localhost:3000/api/scrape';

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!r.ok) return '';
    const data = await r.json();
    return (data.text as string) || '';
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  const { query, mode } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  // 1) Search
  const searchResults: SearchItem[] = await bingSearch(query);
  // 2) Scrape top 3
  const top: SearchItem[] = searchResults.slice(0, 3);
  const texts: string[] = [];
  for (const r of top) {
    const t = await scrape(r.url);
    if (t) texts.push(`SOURCE: ${r.title}\nURL: ${r.url}\nTEXT:\n${t}`);
  }

  // Hindi preference (Citizen)
  const preferHindi =
    mode !== 'lawyer' &&
    typeof process !== 'undefined' &&
    (process?.env?.PREFER_HINDI === '1');

  if (!apiKey) {
    const mock = {
      answer:
`**${mode === 'lawyer' ? 'Issues & Authorities' : 'Plain-language summary'}**

This is a demo answer. Connect OPENAI_API_KEY for grounded responses built from official sources.

**Citations:**
${top.map((r: SearchItem, i: number) => `[${i + 1}] ${r.title}`).join('\n')}`,
      sources: top.map((r: SearchItem) => ({ title: r.title, url: r.url }))
    };
    return NextResponse.json(mock);
  }

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const system =
      mode === 'lawyer'
        ? "You are a legal research assistant for Indian lawyers. Answer ONLY from the provided source excerpts. If insufficient, say so. Start with issues and holdings, then ratio, then key paragraphs. Always show citations with section/paragraph numbers. Keep tone concise and neutral."
        : "You are a legal explainer for citizens in India. Use simple language and short sentences. Answer ONLY from the provided source excerpts. If insufficient, say so. List practical steps, documents required, offices to approach, and typical timelines. Always show citations with section numbers. Add a caution note. Keep it respectful and neutral.";

    const user = `Question: ${query}
Guidelines:
- Use ONLY the sources below; if they don't cover the answer, say: "Insufficient authority found. Refine your query."
- Cite Acts/Sections and judgment paragraph numbers when present.
${preferHindi ? '- Respond in Hindi unless a section title is English, then keep it English.' : ''}

Sources:
${texts.join('\n\n-----\n\n')}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const text = completion.choices[0]?.message?.content ?? "Insufficient authority found. Refine your query.";
    const sources = top.map((r: SearchItem) => ({ title: r.title, url: r.url }));
    return NextResponse.json({ answer: text, sources });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'LLM error' }, { status: 500 });
  }
}

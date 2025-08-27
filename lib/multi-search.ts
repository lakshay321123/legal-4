export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

async function bingSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.BING_API_KEY;
  if (!key) return [];
  const domainFilter =
    'site:indiacode.nic.in OR site:egazette.nic.in OR site:sci.gov.in OR (site:gov.in "High Court")';
  const q = `${query} ${domainFilter}`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
    q
  )}&mkt=en-IN&count=10&responseFilter=Webpages`;
  const r = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
  }).catch(() => null);
  if (!r || !r.ok) return [];
  const data = await r.json().catch(() => ({}));
  return (data.webPages?.value || []).map((x: any) => ({
    title: x.name,
    url: x.url,
    snippet: x.snippet,
    engine: 'bing',
  }));
}

async function googleSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return [];
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(
    query
  )}`;
  const r = await fetch(url).catch(() => null);
  if (!r || !r.ok) return [];
  const data = await r.json().catch(() => ({}));
  return (data.items || []).map((x: any) => ({
    title: x.title,
    url: x.link,
    snippet: x.snippet,
    engine: 'google',
  }));
}

async function geminiSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.GEMINI_SEARCH_KEY;
  if (!key) return [];
  const url = `https://generativelanguage.googleapis.com/v1beta/grounding:search?query=${encodeURIComponent(
    query,
  )}&key=${key}`;
  const r = await fetch(url).catch(() => null);
  if (!r || !r.ok) return [];
  const data = await r.json().catch(() => ({}));
  const items = (data.results || data.webResults || []) as any[];
  return items.map((x: any) => ({
    title: x.title || '',
    url: x.url || x.link || '',
    snippet: x.snippet || x.content || '',
    engine: 'gemini',
  }));
}

async function legalDbSearch(query: string): Promise<SearchResult[]> {
  const endpoint = process.env.LEGAL_DB_SEARCH_URL;
  if (!endpoint) return [];
  const url = `${endpoint}?q=${encodeURIComponent(query)}`;
  const r = await fetch(url).catch(() => null);
  if (!r || !r.ok) return [];
  const data = await r.json().catch(() => ({}));
  if (!Array.isArray(data.results)) return [];
  return data.results.map((x: any) => ({
    title: x.title,
    url: x.url,
    snippet: x.snippet || '',
    engine: 'legal',
  }));
}

export async function multiSearch(query: string) {
  const engines = [bingSearch, googleSearch, geminiSearch, legalDbSearch];
  const settled = await Promise.allSettled(engines.map((fn) => fn(query)));
  let results: SearchResult[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') results = results.concat(s.value);
  }
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of results) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    deduped.push(r);
  }
  if (!deduped.length) {
    return {
      results: [],
      message:
        "Sorry, I couldn't find relevant information. Please refine your question or try again later.",
    };
  }
  return { results: deduped };
}

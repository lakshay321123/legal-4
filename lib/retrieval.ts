export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SourceSummary {
  url: string;
  summary: string;
}

// Search Bing for legal sources similar to app/api/websearch/route.ts
export async function searchLegalSources(query: string): Promise<SearchResult[]> {
  const key = process.env.BING_API_KEY;
  if (!key || !query.trim()) return [];

  const domainFilter = 'site:indiacode.nic.in OR site:egazette.nic.in OR site:sci.gov.in OR (site:gov.in "High Court")';
  const q = `${query} ${domainFilter}`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-IN&count=5&responseFilter=Webpages`;

  try {
    const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.webPages?.value || []).map((x: any) => ({
      title: x.name as string,
      url: x.url as string,
      snippet: x.snippet as string
    }));
  } catch {
    return [];
  }
}

// Fetch each URL, extract text using the scrape route logic and return a short summary
export async function fetchSummaries(urls: string[]): Promise<SourceSummary[]> {
  const out: SourceSummary[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const html = await res.text();

      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(html, { url });
      const { Readability } = await import('@mozilla/readability');
      const doc = new Readability(dom.window.document).parse();

      let text = '';
      if (doc?.textContent && doc.textContent.trim().length > 200) {
        text = doc.textContent;
      } else {
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        text = $('body').text().replace(/\s+/g, ' ').trim();
      }

      text = text.slice(0, 25000);
      const summary = summarize(text);
      out.push({ url, summary });
    } catch {
      // ignore individual failures
    }
  }
  return out;
}

function summarize(text: string, maxSentences = 3): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[\.\!\?])\s+/)
    .slice(0, maxSentences);
  return sentences.join(' ').trim();
}

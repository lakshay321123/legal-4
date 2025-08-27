import { NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const DOMAIN_FILTER =
  'site:indiacode.nic.in OR site:egazette.nic.in OR site:sci.gov.in OR (site:gov.in "High Court")';

const FALLBACK_RESULTS: SearchResult[] = [
  {
    title: 'India Code — Search',
    url: 'https://www.indiacode.nic.in/',
    snippet: 'Official repository of Acts and subordinate legislation.'
  },
  {
    title: 'e-Gazette of India',
    url: 'https://egazette.nic.in/',
    snippet: 'Official Gazette notifications.'
  },
  {
    title: 'Supreme Court of India — Judgments',
    url: 'https://main.sci.gov.in/judgments',
    snippet: 'Official judgments.'
  }
];

async function searchBing(query: string): Promise<SearchResult[]> {
  const key = process.env.BING_API_KEY;
  if (!key) return [];

  const q = `${query} ${DOMAIN_FILTER}`;
  const url =
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-IN&count=10&responseFilter=Webpages`;
  const r = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': key }
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.webPages?.value || []).map((x: any) => ({
    title: x.name,
    url: x.url,
    snippet: x.snippet
  }));
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX; // Custom Search Engine ID
  if (!key || !cx) return [];

  const q = `${query} ${DOMAIN_FILTER}`;
  const url =
    `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${key}&cx=${cx}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return (data.items || []).map((x: any) => ({
    title: x.title,
    url: x.link,
    snippet: x.snippet
  }));
}

function fallbackResults(): SearchResult[] {
  return FALLBACK_RESULTS;
}

export async function POST(req: Request) {
  const { query, provider } = await req.json();
  const selectedProvider =
    (provider || process.env.WEBSEARCH_PROVIDER || 'bing').toLowerCase();

  let results: SearchResult[] = [];
  if (selectedProvider === 'google') {
    results = await searchGoogle(query);
  } else {
    // default to Bing
    results = await searchBing(query);
  }

  if (!results.length) {
    results = fallbackResults();
  }

  return NextResponse.json({ results });
}


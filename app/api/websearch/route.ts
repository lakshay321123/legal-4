import { NextResponse } from 'next/server';

const DOMAINS = [
  'indiacode.nic.in',
  'egazette.nic.in',
  'main.sci.gov.in',
  'sci.gov.in',
  'gov.in'
];

export async function POST(req: Request) {
  const { query } = await req.json();
  const key = process.env.BING_API_KEY;
  if (!key) {
    // Fallback static suggestions
    return NextResponse.json({
      results: [
        { title: 'India Code — Search', url: 'https://www.indiacode.nic.in/', snippet: 'Official repository of Acts and subordinate legislation.' },
        { title: 'e-Gazette of India', url: 'https://egazette.nic.in/', snippet: 'Official Gazette notifications.' },
        { title: 'Supreme Court of India — Judgments', url: 'https://main.sci.gov.in/judgments', snippet: 'Official judgments.' }
      ]
    });
  }

  // Use Bing Web Search v7
  const domainFilter = DOMAINS.map((d) =>
    d === 'gov.in' ? `(site:${d} "High Court")` : `site:${d}`
  ).join(' OR ');
  const q = `${query} ${domainFilter}`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-IN&count=10&responseFilter=Webpages`;

  const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
  if (!r.ok) {
    return NextResponse.json({ results: [] });
  }
  const data = await r.json();
  const results = (data.webPages?.value || []).map((x: any) => ({
    title: x.name,
    url: x.url,
    snippet: x.snippet
  }));
  return NextResponse.json({ results });
}

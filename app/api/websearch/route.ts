import { NextResponse } from 'next/server';

// Domain sets for different material types. These are intentionally small and
// focused on reliable, legal sources.
const DOMAINS: Record<string, string[]> = {
  case_law: [
    'indiankanoon.org',
    'main.sci.gov.in',
    'sci.gov.in',
    // High Courts often have their own domains; "highcourt" is used as a
    // contains filter below.
    'highcourt'
  ],
  research: [
    'indiacode.nic.in',
    'egazette.nic.in',
    'lawcommissionofindia.nic.in',
    // A couple of academic journal hosts
    'academic.oup.com',
    'journals.sagepub.com'
  ],
  // Fallback/general mix of trusted repositories
  default: [
    'indiacode.nic.in',
    'egazette.nic.in',
    'sci.gov.in',
    'indiankanoon.org',
    'gov.in'
  ]
};

function buildDomainFilter(type: string | undefined) {
  const list = DOMAINS[type as keyof typeof DOMAINS] || DOMAINS.default;
  return list
    .map((d) => (d === 'highcourt' ? '(site:gov.in "High Court")' : `site:${d}`))
    .join(' OR ');
}

export async function POST(req: Request) {
  const { query, materialType } = await req.json();
  const key = process.env.BING_API_KEY;
  if (!key) {
    // Fallback static suggestions
    return NextResponse.json({
      results: [
        {
          title: 'India Code — Search',
          url: 'https://www.indiacode.nic.in/',
          snippet: 'Official repository of Acts and subordinate legislation.',
          score: 1
        },
        {
          title: 'e-Gazette of India',
          url: 'https://egazette.nic.in/',
          snippet: 'Official Gazette notifications.',
          score: 1
        },
        {
          title: 'Supreme Court of India — Judgments',
          url: 'https://main.sci.gov.in/judgments',
          snippet: 'Official judgments.',
          score: 1
        }
      ]
    });
  }

  // Use Bing Web Search v7
  const domainFilter = buildDomainFilter(materialType);
  const q = `${query} (${domainFilter})`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-IN&count=10&responseFilter=Webpages`;

  const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
  if (!r.ok) {
    return NextResponse.json({ results: [] });
  }
  const data = await r.json();
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const domainWeights: Record<string, number> = {
    'indiankanoon.org': 5,
    'main.sci.gov.in': 5,
    'sci.gov.in': 5,
    'egazette.nic.in': 4,
    'indiacode.nic.in': 4,
    'lawcommissionofindia.nic.in': 3,
    'academic.oup.com': 2,
    'journals.sagepub.com': 2
  };

  const results = (data.webPages?.value || [])
    .map((x: any) => {
      const domain = new URL(x.url).hostname;
      let score = domainWeights[domain] || 0;
      if (domain.includes('highcourt')) score = Math.max(score, 4);
      const text = `${x.name} ${x.snippet}`.toLowerCase();
      for (const k of keywords) {
        if (text.includes(k)) score += 1;
      }
      return {
        title: x.name,
        url: x.url,
        snippet: x.snippet,
        score
      };
    })
    .sort((a: any, b: any) => b.score - a.score);
  return NextResponse.json({ results });
}

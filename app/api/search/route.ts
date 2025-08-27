import { NextResponse } from 'next/server';

// POST /api/search
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;
    const servingConfig = process.env.GOOGLE_SEARCH_SERVING_CONFIG;

    if (!apiKey || !servingConfig) {
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    const url = `https://discoveryengine.googleapis.com/v1/${servingConfig}:search`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!r.ok) {
      return NextResponse.json({ results: [] }, { status: r.status });
    }

    const data = await r.json();
    const results = (data.results || []).map((item: any) => {
      const doc = item.document || {};
      const link = doc.uri || doc.derivedStructData?.link || doc.structData?.link || '';
      return {
        title: doc.title || link,
        url: link,
        snippet: doc.snippet || '',
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[search route error]', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

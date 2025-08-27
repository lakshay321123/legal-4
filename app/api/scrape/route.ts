import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const service = process.env.SCRAPER_SERVICE_URL;
    if (!service) {
      return NextResponse.json({ error: 'Scraper not configured' }, { status: 500 });
    }

    const res = await fetch(service, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 });
    }
    const data = await res.json().catch(() => ({}));
    const text = (data?.text as string) || '';

    return NextResponse.json({ text: text.slice(0, 25000) });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 });
  }
}

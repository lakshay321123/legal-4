import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();

    // Try Readability first (clean article)
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, { url });
    const { Readability } = await import('@mozilla/readability');
    const doc = new Readability(dom.window.document).parse();

    let text = '';
    if (doc?.textContent && doc.textContent.trim().length > 200) {
      text = doc.textContent;
    } else {
      // Fallback to cheerio to grab visible text
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      text = $('body').text().replace(/\s+/g, ' ').trim();
    }

    return NextResponse.json({ text: text.slice(0, 25000) });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 });
  }
}

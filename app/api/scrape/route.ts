import { NextResponse } from 'next/server';
import { isIP } from 'node:net';

export const runtime = 'nodejs';

const ALLOWED_DOMAINS = ['example.com'];

function isPrivateHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const parts = host.split('.').map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    );
  }
  if (ipVersion === 6) {
    return host === '::1' || host.startsWith('fc') || host.startsWith('fd');
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const hostname = parsed.hostname;
    const allowed = ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
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

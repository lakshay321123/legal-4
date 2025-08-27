import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
export const runtime = 'nodejs';

function isPrivate(ip: string) {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  if (ip.startsWith('172.')) {
    const second = Number(ip.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
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

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    if (parsed.hostname === 'localhost') {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
    }

    try {
      const addresses = await lookup(parsed.hostname, { all: true });
      if (addresses.some((a) => isPrivate(a.address))) {
        return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
    }

    const sanitized = parsed.toString();
    const res = await fetch(sanitized, { redirect: 'follow' });
    const html = await res.text();

    // Try Readability first (clean article)
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, { url: sanitized });
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

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const MAX_CHARS = 12000;

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LexLensBot/1.0 (+https://example.com/bot)' }
    });
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    let text = article?.textContent || cheerio.load(html)('body').text();
    text = text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'scrape failed' }, { status: 500 });
  }
}

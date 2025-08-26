// app/api/upload/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';

async function extractFromPdf(buf: Buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const res = await pdfParse(buf);
  return res.text || '';
}

async function extractFromDocx(buf: Buffer) {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return value || '';
}

async function ocrWithGemini(imageBase64: string, mimeType: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return '[OCR unavailable: missing GEMINI_API_KEY]';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: 'Extract the readable text and key facts from this image. Return plain text.' },
        { inline_data: { mime_type: mimeType, data: imageBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) return `[OCR error ${res.status}] ${text.slice(0,300)}`;
  const data = JSON.parse(text);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text ?? '').join('').trim();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const items = form.getAll('files');

    const out: Array<{ name: string; type: string; text: string }> = [];

    for (const it of items) {
      const f = it as File;
      const name = f.name || 'file';
      const type = f.type || 'application/octet-stream';
      const buf = Buffer.from(await f.arrayBuffer());

      let text = '';
      if (type === 'application/pdf') {
        text = await extractFromPdf(buf);
      } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractFromDocx(buf);
      } else if (type.startsWith('image/')) {
        const b64 = buf.toString('base64');
        text = await ocrWithGemini(b64, type);
      } else if (type.startsWith('text/')) {
        text = buf.toString('utf8');
      } else {
        // fall back: try utf8
        text = buf.toString('utf8');
      }

      // limit very large files
      if (text.length > 40_000) text = text.slice(0, 40_000) + '\n[truncated]';
      out.push({ name, type, text: text.trim() });
    }

    return NextResponse.json({ files: out });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

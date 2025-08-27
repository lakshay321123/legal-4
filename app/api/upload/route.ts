import { NextResponse } from 'next/server';
export const runtime = 'edge';

type Doc = { name: string; type: string; text: string };

async function sendToParser(file: File, name: string) {
  const url = process.env.PARSER_SERVICE_URL;
  if (!url) return '';
  const fd = new FormData();
  fd.append('file', file, name);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) return '';
  const data = await res.json().catch(() => ({}));
  return (data?.text as string) || '';
}

async function readImageToHint(_buf: ArrayBuffer) {
  // For now: we don’t OCR; just a stub note.
  return '[Image attached: describe its legal context in your answer.]';
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const out: Doc[] = [];

  for (const f of files) {
    const name = f.name || 'file';
    const lc = name.toLowerCase();

    let text = '';
    try {
      if (lc.endsWith('.pdf') || lc.endsWith('.docx')) {
        text = await sendToParser(f, name);
      } else if (lc.endsWith('.txt')) {
        const ab = await f.arrayBuffer();
        text = new TextDecoder().decode(ab);
      } else if (f.type.startsWith('image/')) {
        text = await readImageToHint(await f.arrayBuffer());
      } else {
        text = ''; // unsupported
      }
    } catch {
      text = '';
    }

    if (text.trim()) {
      out.push({ name, type: f.type || 'unknown', text: text.slice(0, 20000) });
    }
  }

  return NextResponse.json({ files: out });
}

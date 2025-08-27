import { NextResponse } from 'next/server';
import { chunkText, embedTexts, addToVectorStore, PROVIDER } from '@/lib/vector-store';
export const runtime = 'nodejs'; // pdf-parse/mammoth need Node

type Doc = { name: string; type: string; text: string };

async function readPdf(buf: Buffer) {
  const pdfParse = (await import('pdf-parse')).default as any;
  const data = await pdfParse(buf);
  return (data?.text as string) || '';
}

async function readDocx(buf: Buffer) {
  const mammoth = await import('mammoth');
  const res = await mammoth.extractRawText({ buffer: buf });
  return (res?.value as string) || '';
}

async function readImageToHint(_buf: Buffer) {
  // For now: we don’t OCR; just a stub note.
  return '[Image attached: describe its legal context in your answer.]';
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const out: Doc[] = [];

  for (const f of files) {
    const ab = await f.arrayBuffer();
    const buf = Buffer.from(ab);
    const name = f.name || 'file';
    const lc = name.toLowerCase();

    let text = '';
    try {
      if (lc.endsWith('.pdf')) {
        text = await readPdf(buf);
      } else if (lc.endsWith('.docx')) {
        text = await readDocx(buf);
      } else if (lc.endsWith('.txt')) {
        text = buf.toString('utf8');
      } else if (f.type.startsWith('image/')) {
        text = await readImageToHint(buf);
      } else {
        text = ''; // unsupported
      }
    } catch {
      text = '';
    }

    if (text.trim()) {
      const trimmed = text.slice(0, 20000);
      out.push({ name, type: f.type || 'unknown', text: trimmed });
      try {
        const chunks = chunkText(trimmed);
        const embeddings = await embedTexts(chunks);
        await addToVectorStore(
          chunks.map((c, i) => ({
            id: `${name}-${Date.now()}-${i}`,
            provider: PROVIDER,
            embedding: embeddings[i],
            text: c,
            metadata: { name, type: f.type || 'unknown', chunk: i },
          }))
        );
      } catch (err) {
        console.error('[upload embedding error]', err);
      }
    }
  }

  return NextResponse.json({ files: out });
}

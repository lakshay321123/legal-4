import { NextResponse } from 'next/server';
export const runtime = 'nodejs'; // pdf-parse/mammoth need Node

// Upload limits: max of 5 files, each up to 5MB
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  // Enforce upload limits
  if (files.length > MAX_FILES || files.some((f) => f.size > MAX_FILE_SIZE)) {
    return NextResponse.json(
      { error: 'File too large/too many files' },
      { status: 400 },
    );
  }
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
      out.push({ name, type: f.type || 'unknown', text: text.slice(0, 20000) });
    }
  }

  return NextResponse.json({ files: out });
}

import { NextResponse } from 'next/server';
export const runtime = 'nodejs'; // pdf-parse/mammoth need Node

type Doc = { name: string; type: string; text?: string; error?: string };

async function runOcr(buf: Buffer) {
  const Tesseract = (await import('tesseract.js')).default;
  const {
    data: { text },
  } = await Tesseract.recognize(buf, 'eng');
  return text as string;
}

async function readPdf(buf: Buffer) {
  const pdfParse = (await import('pdf-parse')).default as any;
  const data = await pdfParse(buf);
  let text = (data?.text as string) || '';
  if (!text.trim()) {
    text = await runOcr(buf);
  }
  return text;
}

async function readDocx(buf: Buffer) {
  const mammoth = await import('mammoth');
  const res = await mammoth.extractRawText({ buffer: buf });
  return (res?.value as string) || '';
}

async function readXlsx(buf: Buffer) {
  const xlsx = await import('xlsx');
  const wb = xlsx.read(buf, { type: 'buffer' });
  let text = '';
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1 });
    for (const row of rows) {
      text += row.join('\t') + '\n';
    }
  }
  return text;
}

async function readPptx(buf: Buffer) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml')
  );
  slideFiles.sort();
  let text = '';
  for (const file of slideFiles) {
    const xml = await zip.files[file].async('string');
    const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
    if (matches) {
      for (const m of matches) {
        text += m.replace(/<[^>]+>/g, '') + '\n';
      }
    }
  }
  return text;
}

async function readImage(buf: Buffer) {
  return runOcr(buf);
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
    let error: string | undefined;
    try {
      if (lc.endsWith('.pdf')) {
        text = await readPdf(buf);
      } else if (lc.endsWith('.docx')) {
        text = await readDocx(buf);
      } else if (lc.endsWith('.xlsx')) {
        text = await readXlsx(buf);
      } else if (lc.endsWith('.pptx')) {
        text = await readPptx(buf);
      } else if (lc.endsWith('.txt')) {
        text = buf.toString('utf8');
      } else if (f.type.startsWith('image/')) {
        text = await readImage(buf);
      } else {
        error = 'Unsupported file type';
      }
    } catch (e: any) {
      error = e?.message || 'Failed to parse file';
    }

    if (text.trim()) {
      out.push({ name, type: f.type || 'unknown', text: text.slice(0, 20000) });
    } else {
      out.push({ name, type: f.type || 'unknown', error: error || 'No text extracted' });
    }
  }

  return NextResponse.json({ files: out });
}

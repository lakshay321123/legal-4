import { NextResponse } from 'next/server';
import { multiSearch } from '@/lib/multi-search';

const MAX_QUERY_LENGTH = 500;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return NextResponse.json(
      { results: [], message: 'Please provide a search query.' },
      { status: 400 },
    );
  }

  const safeQuery = query.slice(0, MAX_QUERY_LENGTH);
  const { results, message } = await multiSearch(safeQuery);
  if (message) {
    return NextResponse.json({ results: [], message });
  }
  return NextResponse.json({ results });
}

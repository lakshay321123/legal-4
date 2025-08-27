import { NextResponse } from 'next/server';
import { multiSearch } from '@/lib/multi-search';

export async function POST(req: Request) {
  const { query } = await req.json();
  const { results, message } = await multiSearch(query);
  if (message) {
    return NextResponse.json({ results: [], message });
  }
  return NextResponse.json({ results });
}

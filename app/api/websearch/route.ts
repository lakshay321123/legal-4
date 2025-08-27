import { NextResponse } from 'next/server';
import { multiSearch } from '@/lib/multi-search';
import { rewriteQuery } from '@/lib/rewrite-query';

export async function POST(req: Request) {
  const { query } = await req.json();
  const rewritten = await rewriteQuery(query);
  const { results, message } = await multiSearch(rewritten);
  const payload: any = { results, query, rewrittenQuery: rewritten };
  if (message) payload.message = message;
  return NextResponse.json(payload);
}

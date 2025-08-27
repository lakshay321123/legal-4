import { NextResponse } from 'next/server';
import { multiSearch, SearchResult } from '@/lib/multi-search';
import { rewriteQuery } from '@/lib/rewrite-query';

type WebSearchResponse = {
  results: SearchResult[];
  query: string;
  rewrittenQuery: string;
  message?: string;
};

export async function POST(req: Request) {
  const { query } = await req.json();
  const rewritten = await rewriteQuery(query);
  const { results, message } = await multiSearch(rewritten);
  const payload: WebSearchResponse = { results, query, rewrittenQuery: rewritten };
  if (message) payload.message = message;
  return NextResponse.json(payload);
}

import { NextResponse } from 'next/server';
import { multiSearch } from '@/lib/multi-search';

const DISCLAIMER =
  '⚠️ Informational only — not a substitute for advice from a licensed advocate.';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const question = (body.question ?? body.q ?? '').toString();

  // Only ask for a follow-up if nothing was asked
  if (!question || !question.trim()) {
    return NextResponse.json({ answer: 'Please provide a question.' }, { status: 400 });
  }

  // Quick initial search across Bing/Google/legal DB
  const { results, message } = await multiSearch(question);

  // If the search produced nothing, fall back to a generic response
  if (message || results.length === 0) {
    return NextResponse.json({
      answer:
        (message || "I couldn't find relevant information. Try rephrasing your question.") +
        `\n\n${DISCLAIMER}`,
      sources: [],
    });
  }

  // Use the top result to craft a concise answer
  const top = results[0];
  const answer = `${top.snippet}\n\nSource: ${top.url}\n\n${DISCLAIMER}`;

  return NextResponse.json({
    answer,
    sources: [top], // Return the first hit as reference
  });
}

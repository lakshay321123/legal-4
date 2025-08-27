import { NextResponse } from 'next/server';
import { multiSearch } from '@/lib/multi-search';

export async function POST(req: Request) {
  const { question } = await req.json();

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
        message || "I couldn't find relevant information. Try rephrasing your question.",
      sources: [],
    });
  }

  // Use the top result to craft a concise answer
  const top = results[0];
  const answer = `${top.snippet}\n\nSource: ${top.url}`;

  return NextResponse.json({
    answer,
    sources: [top], // Return the first hit as reference
  });
}

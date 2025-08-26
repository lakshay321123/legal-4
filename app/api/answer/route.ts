import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { q, mode } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ answer: "❌ Missing OpenAI API Key. Set it in Vercel > Environment Variables." }, { status: 500 });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheaper
      messages: [
        { role: "system", content: mode === 'lawyer'
            ? "You are a legal research assistant. Provide precise, cited answers."
            : "You are a helpful assistant. Explain in plain English."
        },
        { role: "user", content: q }
      ],
      max_tokens: 400,
    });

    const answer = completion.choices[0]?.message?.content ?? "No answer generated.";

    return NextResponse.json({
      answer,
      sources: [], // in future we’ll add scraped sources
    });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ answer: "⚠️ Error talking to OpenAI. Check API key." }, { status: 500 });
  }
}

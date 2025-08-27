# LexLens — Legal Search AI (MVP)

A simple, elegant, ChatGPT-style legal search interface with **New chat**, **Search chats**, **Library**, and **Previous chats**. Two modes: **Citizen** and **Lawyer** (with a free 10-prompt monthly trial for Lawyer mode).

> Informational only. Not legal advice. This MVP stores chats in your browser (localStorage).

## Features
- Chat-style Q&A with sources panel
- Citizen/Lawyer toggle with UI banners
- New chat, Previous chats (sidebar), Search chats page
- Save any AI answer to your Library
- Lawyer trial limiter: 10 prompts/month on the free plan
- Basic API route `/api/answer` with OpenAI support if you set a key; otherwise mock answers with official source links
- Legal pages: Disclaimer, Terms, Privacy, Sourcing

## Quick start
```bash
pnpm i     # or npm i or yarn
cp .env.local.example .env.local
# (optional) edit .env.local and add GEMINI_API_KEY=... or OPENAI_API_KEY=sk-...

pnpm dev   # then open http://localhost:3000
```

## Environment
- `AI_PROVIDER` (optional): choose `gemini` (default) or `openai`.
- `GEMINI_API_KEY` (optional): used when `AI_PROVIDER=gemini`.
- `GEMINI_MODEL` (optional): override the Gemini model (default `gemini-1.5-flash`).
- `OPENAI_API_KEY` (optional): used when `AI_PROVIDER=openai`. Without it you'll see a demo answer with source links.

Missing keys will produce the "❌ Missing GEMINI_API_KEY/OPENAI_API_KEY" error response in `/api/answer`.

## Roadmap hooks (not included yet)
- Retrieval pipeline (India Code / Gazette / SC / HCs) with hybrid search and RAG
- Server storage (Postgres) and auth
- Billing (Stripe) with plans as described
- DPDP-compliant privacy dashboard

---

© 2025 LexLens. Informational only; not legal advice.


## Optional retrieval keys
- `BING_API_KEY` – for official-domain web search (India Code, e-Gazette, Supreme Court, etc.).
- `NEXT_PUBLIC_BASE_URL` – set this to your deployed base URL so the server can call its own `/api/scrape` in production.
- `PREFER_HINDI=1` – environment flag to prefer Hindi for Citizen answers.

Example `.env.local`:
```
AI_PROVIDER=gemini # or openai
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=sk-...
BING_API_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# PREFER_HINDI=1
```

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
# (optional) edit .env.local and add OPENAI_API_KEY=sk-...

pnpm dev   # then open http://localhost:3000
```

## Environment
- `AI_PROVIDER` (optional): `openai` (default) or `gemini`.
- `OPENAI_API_KEY` (optional): for OpenAI answers. Without it you'll see a demo answer with source links.
- `GEMINI_API_KEY` (required if `AI_PROVIDER=gemini`): for Google Gemini answers.

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
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
# For Gemini instead:
# AI_PROVIDER=gemini
# GEMINI_API_KEY=...
BING_API_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# PREFER_HINDI=1
```

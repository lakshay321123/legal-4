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
- Unified search module that queries Bing, Google and optional legal databases, dedupes results and returns a single response
- Legal pages: Disclaimer, Terms, Privacy, Sourcing

## Quick start
```bash
pnpm i     # or npm i or yarn
cp .env.local.example .env.local
# (optional) edit .env.local and add OPENAI_API_KEY=sk-...

pnpm dev   # then open http://localhost:3000
```

## Environment
- `OPENAI_API_KEY` (optional): for real answers. Without it you'll see a demo answer with source links.
- `AI_PROVIDER` – LLM provider (`gemini` by default; set to `openai` to use OpenAI).
- `GEMINI_API_KEY` – required when `AI_PROVIDER=gemini`.
- `GEMINI_MODEL` – optional, default `gemini-1.5-flash`.

## Roadmap hooks (not included yet)
- Retrieval pipeline (India Code / Gazette / SC / HCs) with hybrid search and RAG
- Server storage (Postgres) and auth
- Billing (Stripe) with plans as described
- DPDP-compliant privacy dashboard

---

© 2025 LexLens. Informational only; not legal advice.


## Optional retrieval keys
- `BING_API_KEY` – for official-domain web search (India Code, e-Gazette, Supreme Court, etc.).
- `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` – enable Google Custom Search as an additional source.
- `LEGAL_DB_SEARCH_URL` – HTTP endpoint for any in-house legal database search API.
- `NEXT_PUBLIC_BASE_URL` – set this to your deployed base URL so the server can call its own `/api/scrape` in production.
- `PREFER_HINDI=1` – environment flag to prefer Hindi for Citizen answers.

Example `.env.local`:
```
# Gemini (default)
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash

# OpenAI (uncomment to use)
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
BING_API_KEY=...
GOOGLE_API_KEY=...
GOOGLE_CSE_ID=...
LEGAL_DB_SEARCH_URL=https://legal.example.com/search
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# PREFER_HINDI=1
```

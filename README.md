# CodeTrappers Chatbot: RAG Prototype

Next.js (Vercel) + Supabase (Postgres, pgvector, RLS) + Claude + Voyage AI.
A company assistant that answers questions about CodeTrappers (offerings, pricing, billing, accounts, policies, support) from CodeTrappers' own content, and declines unrelated or general coding questions. Implements the approach in the design doc: structure-aware chunking, hybrid search (vector + keyword, fused with RRF), reranking, query rewriting with Haiku, grounded streamed answers with validated `[n]` citations, entitlement filtering, logging and thumbs feedback.

## 1. Accounts and keys
- Anthropic API key: https://console.anthropic.com
- Voyage AI API key: https://dash.voyageai.com
- Supabase project (free tier works for the prototype)

## 2. Database
In the Supabase SQL editor, run `supabase/schema.sql` once.
(The vector column is `vector(1024)` to match `voyage-3.5`. If you change embedding models, change the dimension and re-index.)

## 3. Configure and run locally
```bash
cp .env.example .env.local     # fill in the four values
npm install
npm run ingest                 # indexes ./content/**/*.md (re-run any time; only changed files are re-embedded)
npm run dev                    # http://localhost:3000
```
Try: "What does CodeTrappers offer?", "How do I get a refund?", "What are the pricing plans?"
Also try an off-topic question ("write a Python sorting function"): the assistant should politely decline. And ask "what are the member benefits?": that file is `access: enrolled`, so anonymous users get a "could not find it" answer. That is the access filter working.

## 4. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it in Vercel.
3. Add the env vars from `.env.example` (Settings > Environment Variables).
4. Deploy. Re-run `npm run ingest` locally whenever content changes (it writes straight to Supabase), or later move it to a Vercel Cron / Supabase webhook.

## 5. Replace the sample content
Every file in `content/` is SAMPLE placeholder text. Delete them and add your real company material (about, pricing, policies, FAQs, course catalogue, announcements, contact details).

### Front matter
Drop Markdown files into `content/` with front matter:
```
---
title: Plans and Pricing
url: /pricing
access: public        # public | enrolled | paid
type: pricing
---
```
Deleted files are removed from the index on the next ingest.

## How access control works
- Every chunk carries `access_level`.
- `/api/chat` reads an optional `Authorization: Bearer <Supabase access token>`, looks up `profiles.tier`, and passes `allowed_levels` into `hybrid_search`, so locked chunks are never retrieved, not just hidden in the prompt.
- The UI currently sends no token (everyone is "public"). Once you add Supabase Auth to the site, send `session.access_token` in the chat request header.
- To grant access: `insert into profiles (id, tier) values ('<user uuid>', 'paid');`

## Prototype limits (next steps from the roadmap)
- Rate limiting is in-memory per serverless instance; use Upstash/Vercel KV for strict limits.
- No eval harness yet: build the golden set (50 to 300 questions) and measure Recall@5 and faithfulness before tuning chunk size.
- Only Markdown ingestion; add loaders for your CMS, forum (accepted answers only) and code repos.
- Model names default to `claude-sonnet-5-5` and `claude-haiku-5-5`; override with `ANSWER_MODEL` / `FAST_MODEL`.
- Conversation memory is the last 10 messages; add a rolling summary for long chats.
- The `@anthropic-ai/sdk` range is `>=0.39.0`; pin it to the version npm installs once it works for you.

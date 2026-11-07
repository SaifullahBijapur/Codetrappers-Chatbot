# CodeTrappers Chatbot: RAG Prototype

Next.js (Vercel) + Supabase (Postgres, pgvector, RLS) + Claude + Voyage AI.
A website assistant that answers questions about CodeTrappers (WordPress, WooCommerce and AI services, case studies, showcase, guides and articles, policies, careers, contact) from the content of codetrappers.com, and declines unrelated questions. Implements the approach in the design doc: structure-aware chunking, hybrid search (vector + keyword, fused with RRF), reranking, query rewriting with Haiku, grounded streamed answers with validated `[n]` citations, entitlement filtering, logging and thumbs feedback.

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
npm run scrape                 # crawls codetrappers.com into ./content/website (about 380 pages, a few minutes)
npm run ingest                 # indexes ./content/**/*.md (re-run any time; only changed files are re-embedded)
npm run dev                    # http://localhost:3000
```
Try: "What services does CodeTrappers offer?", "How does a monthly retainer work?", "My WordPress site got hacked, what should I do?", "How do I contact you?"
Also try an off-topic question ("who won the match?"): the assistant should politely decline.

## 4. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it in Vercel.
3. Add the env vars from `.env.example` (Settings > Environment Variables).
4. Deploy. Re-run `npm run scrape && npm run ingest` locally whenever the website changes (ingest writes straight to Supabase), or later move it to a Vercel Cron / Supabase webhook.

## 5. Website content (`npm run scrape`)
`scripts/scrape.ts` reads `sitemap_index.xml`, fetches every page (4 at a time, politely), keeps only the `<main>` content (navigation, forms, chat widget, related-post teasers and sidebars are stripped), converts it to Markdown and writes `content/website/<type>/<slug>.md`. Types: `page`, `article`, `guide`, `case-study`, `research`, `white-paper`, `showcase`, `job`. Category listing pages are skipped. The site footer (phone, email, address) is saved once as `page/contact-details.md`.

- Output is deterministic, so a re-scrape only changes files whose page changed, and ingest re-embeds only those.
- On a full, error-free run, files for pages that left the sitemap are deleted; the next ingest removes them from the index.
- `npm run scrape -- --limit 10` for a quick test, `npm run scrape -- --only page,guide` for some types.

You can also add hand-written Markdown anywhere else under `content/` (for example internal FAQs or pricing details not on the website).

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
- Scraped pages are all `access: public`. Put private material (for example client-only docs) in hand-written files with `access: enrolled` or `paid`.
- Model names default to `claude-sonnet-5-5` and `claude-haiku-5-5`; override with `ANSWER_MODEL` / `FAST_MODEL`.
- Conversation memory is the last 10 messages; add a rolling summary for long chats.
- The `@anthropic-ai/sdk` range is `>=0.39.0`; pin it to the version npm installs once it works for you.

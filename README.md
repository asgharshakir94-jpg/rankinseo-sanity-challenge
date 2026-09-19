# RankinSEO × Sanity Challenge — Path One Submission

An agent that queries real production SEO content — migrated from Supabase into Sanity's Content Lake — to detect duplicate and overlapping articles using GROQ.

Built for the [Sanity Challenge](https://dev.to/t/devchallenge), Path One: "ship an agent that queries real content."

**Full write-up:** [DEV.to submission post](https://dev.to/asghar_shakir_e4c8cf45a3e/i-built-an-agent-that-found-real-duplicate-content-in-my-production-seo-database-4faf)

## What this does

1. **`migrate.mjs`** — pulls a curated sample (5 articles per trade: roofing, HVAC, plumbing, solar, electrical) from a live Supabase `campaigns` table and migrates them into Sanity as structured `article` documents.
2. **`agent.mjs`** — queries the migrated Sanity content via GROQ and checks each article's CTA coverage, grouped by trade.
3. **`agent-full-check.mjs`** — the core duplicate-detection agent. Queries article titles, normalizes them (strips stopwords/punctuation), and flags pairs with significant word-overlap similarity — surfacing potential duplicate content.
4. **`fix-titles.mjs`** — a real production fix: found 32 live articles with missing titles, auto-generated proper titles from their keyword field, and applied the fix directly to Supabase.
5. **`check-titles.mjs`** / **`clear-sanity.mjs`** — supporting diagnostic and cleanup scripts used during development.

## Key finding

Running the duplicate-detection agent against the full 130-article production table correctly re-discovered several duplicate clusters already identified and fixed manually in an earlier cleanup pass (e.g. "Gutter Cleaning Cost" vs "Gutter Cleaning Cost 2026", "Commercial Roofing" vs "Commercial Roofing Company").

It also surfaced an honest limitation: word-overlap similarity can't always distinguish "same topic, different angle" from "actual duplicate" — a Calgary-localized article got flagged as similar to generic "near me" articles purely due to shared keywords, despite genuinely different content and intent.

## Stack

- **Source data:** Next.js / Supabase (production RankinSEO database)
- **Content Lake + queries:** Sanity + GROQ
- **Scripts:** Node.js

## Setup

```bash
npm install
```

Create a `.env.local` with:

```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then run any script, e.g.:

```bash
node migrate.mjs
node agent-full-check.mjs
```

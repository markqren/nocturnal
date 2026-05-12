<!--
  ✅ SOURCE OF TRUTH — edit this file directly.
  After editing: run `bash scripts/build-roadmap.sh` to regenerate ROADMAP.md.
  ROADMAP.md is a generated artifact — never edit it directly.
-->

# Active Roadmap

## 🔧 Next Up (V1 — MVP)

| ID | Item | Type | Priority | Details |
|----|------|------|----------|---------|
| INF-01 | **Project scaffold** | Infra | **Critical** | Init Expo/React Native project, set up Supabase instance (Postgres + S3 storage + auth), configure Anthropic API backend function. Get a blank app running on device. |
| INF-02 | **Data model & schema** | Infra | **Critical** | Create Supabase tables: entries, tags, entry_tags, media, conversation_digests, disciplan_events, style_profile. Seed canonical tags (Daily Reflection, Recollections, Dream Catcher, Reviews). |
| INF-04 | **Retrieval architecture design (RAG)** | Infra/Design | **Critical** | Mark-authored design doc before any AI agent code. Chunking strategy, embedding model, hybrid retrieval (semantic + temporal + thread-aware), recency weighting, vector store (likely `pgvector`), per-call context budget. Tracked in `decisions.md`. Prerequisite homework in `homework.md`. Blocks FEA-05, FEA-07, FEA-08, FEA-30. |
| INF-05 | **Advisor voice spec** | Infra/Design | **Critical** | Mark-authored doc defining when the advisor asks / reflects / pushes back / stays quiet; context-pulling triggers; tone register; question-asking patterns by mode. Tracked in `decisions.md`. Blocks FEA-05. |
| INF-06 | **Over-reliance detection — operational definition** | Infra/Design | **Medium** | What counts as over-reliance, how it's measured, how it's surfaced without preachiness. Tracked in `decisions.md`. Blocks FEA-10. |
| INF-07 | **Prompt caching strategy** | Infra/Design | **Medium** | Read Anthropic prompt caching docs (logged in `homework.md`), then decide prompt structure: static system prompt + cached archive context + small per-call deltas. Shapes prompt structure from day one — blocks substantive work on FEA-05. |
| FEA-01 | **Entry creation (text)** | Feature | **Critical** | Basic rich text entry with markdown support. Title, body, entry_date, mood. Save to Supabase. The core interaction — needs to feel good. |
| FEA-02 | **Entry creation (photo)** | Feature | **High** | Photo upload with caption. Store in Supabase S3 storage, link to entry via media table. Multiple photos per entry. |
| FEA-03 | **Tag system** | Feature | **High** | Create/assign tags to entries. Canonical tags always visible. Custom tags freely creatable. Multi-tag per entry. |
| FEA-04 | **Dashboard & calendar** | Feature | **High** | Tag frequency counters. Calendar heatmap showing which days have entries and for which tags. The "at a glance" view. |
| FEA-05 | **AI agent — conversational mode** | Feature | **High** | Built-in chat with Claude (Sonnet via backend function). Asks grounding questions, drafts reflection in my voice, I review/edit/approve before saving as entry. Core differentiator from day one. |
| FEA-06 | **AI agent — style learning** | Feature | **Medium** | System prompt that evolves based on my edits to AI drafts. Store example entries + edit history in style_profile table. V1: manual curation of examples. |
| FEA-07 | **AI agent — restructuring assist** | Feature | **Medium** | When I'm writing and losing coherency, the agent helps me find the thread. Not rewriting — reorganizing my scattered thoughts into something that flows. |
| FEA-08 | **AI agent — inner critic mode** | Feature | **Medium** | Agent validates that what I'm sharing has substance. Encouragement when the inner critic is loud. Combat the "this is vapid" feeling in real-time during conversation mode. |
| FEA-09 | **Entry richness tracking** | Feature | **Medium** | Track entry variety/depth (not just length). Gentle invitations to enrich shallow entries. "You've posted three photo-only entries this week — want to add a thought to one?" |
| FEA-10 | **Over-reliance detection** | Feature | **Low** | Track ratio of AI-assisted vs. direct-written entries. Nudge toward direct writing when ratio skews too high. All AI content requires approval. |
| FEA-11 | **Day One import** | Feature | **High** | Parse Day One JSON/ZIP export. Map entries, photos, metadata, dates. Deduplicate. Map Day One journals → `nocturnal` tags. |
| FEA-12 | **Apple Notes import** | Feature | **Medium** | Parse Apple Notes export (likely HTML or plain text). Messier than Day One — may need manual export steps. Deduplication critical (existing exports have massive repetition). |

---

## 🔮 Future (V2+)

| ID | Item | Type | Priority | Details |
|----|------|------|----------|---------|
| FEA-20 | **Claude conversation ingestion** | Feature | **High** | Periodic export of claude.ai history → compaction layer (Sonnet) extracts reflections, decisions, memorable details → raw material inbox. Same pipeline for backfill and ongoing. **Open:** programmatic export access TBD — may be manual-only. **Cost:** ~$1-2/day heavy days. |
| FEA-21 | **Disciplan integration** | Feature | **High** | Disciplan stays standalone; `nocturnal` ingests via shared DB / webhooks / polling. Task completions, streaks, focus goals as context for nudges and prompts. |
| FEA-22 | **On This Day** | Feature | **High** | Surface old entries from same date in past years. Central to the "archive as product" vision. Passive draw-in when opening the app. |
| FEA-23 | **AI theme reflections** | Feature | **Medium** | Periodic AI-generated summaries: "Over the past month, you've mentioned X five times — here's what that arc looks like." |
| FEA-24 | **Context-based nudges** | Feature | **Medium** | No time-based reminders. Triggered by: Disciplan completions, calendar events, conversation activity. Suggests entry type based on recent signals. |
| FEA-25 | **iOS photo library integration** | Feature | **Medium** | Pull recent photos from camera roll as entry seeds. Low-friction capture for good-times journaling. |
| FEA-26 | **Voice mode** | Feature | **Low** | Voice conversations (STT via Whisper) → AI structures into reflection → review and approve. The "AI calls me" interaction. Adds cost + engineering complexity. |
| FEA-27 | **Workplan integration** | Feature | **Low** | Ingest workplan data alongside Disciplan for fuller life context. |
| INF-03 | **Multi-user portability** | Infra | **Low** | Generalize opinionated design choices for broader use. Not a priority until V1 is proven. |
| FEA-28 | **Guided prompts library** | Feature | **Low** | Curated set of journaling prompts for writer's block days. Concrete, not open-ended. Rotated so they don't feel stale. |
| FEA-29 | **Search** | Feature | **Medium** | Full-text search across all entries. Supabase `to_tsvector` index on body + title. |
| FEA-30 | **AI deep processing mode** | Feature | **High** | Therapeutically-informed agent mode activated when user wants to process something difficult with an entry as a starting point. Agent trained to notice blocked or unexpressed emotions in the writing, ask questions that open things up rather than summarize them, and act as a genuine partner in working through hard material — not just a reflective mirror. System prompt draws on somatic/IFS/ACT frameworks. Distinct from conversational mode in tone and depth. |

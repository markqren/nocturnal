# `nocturnal` — product spec

**Version:** 0.2  
**Date:** April 9, 2026  
**Status:** Pre-build, scoping

---

<details open>
<summary><h2>1. Vision</h2></summary>

`nocturnal` is built around one question: why have I failed to maintain a journaling habit despite wanting one for over a decade?

**Success metric:** Do I keep coming back?

### What I've learned from 10 years of on-and-off journaling

- The archive is the real product. The best journaling experience I've had was spending two hours re-reading old entries.
- Concrete entries age best. Specific memories hold up on re-read. Abstract philosophizing about what journaling should be doesn't.
- The inner critic kills momentum. I judge my writing mid-stream and it makes the whole thing feel performative.
- Meta-journaling is a trap. Too many entries are about redefining the journal rather than actually journaling.
- AI prompts can provide useful structure, but synthesis is surface-level. My own additions are always the most valuable parts.
- I journal more when life is hard, less when it's good. The app needs to break that association.

</details>

---

<details open>
<summary><h2>2. Core Design Principle — Unified Archive, AI as Context-Puller</h2></summary>

The unified archive is the substrate; context-pulling is the AI's job, not the user's. Mark writes into one place. The AI reasons across the whole archive and surfaces relevant context at the right moments. If the user ever pauses to ask "should I put this here or there," the design has failed.

Downstream implications:

- **Storage:** single canonical store. No project/folder structure imposed as a precondition for writing.
- **Retrieval:** semantic + temporal + thread-aware. Not keyword-only. Selective recall — pull relevant historical context for a moment, not the full archive.
- **Prompting:** the model needs structured access to the archive, not just the current entry. Prompt structure must be cache-friendly from day one (see § 5 and § 6).
- **Tags/threads:** emergent properties of the archive, not gates on entry.

This principle binds both the product (what users experience) and the development process (how agents build it). See `CLAUDE.md` § 0 and `decisions.md`.

</details>

---

<details>
<summary><h2>3. Problems & Solutions</h2></summary>

Specific pain points from past journaling attempts, and how `nocturnal` addresses each one.

#### 1. ✍️ The blank page triggers self-criticism

I judge my writing in real-time — it feels campy, cringe, inauthentic. This makes journaling feel performative and kills momentum before I get anywhere.

**How `nocturnal` addresses this:**
- Multiple entry types with no hierarchy. A photo with a caption is as valid as a three-paragraph reflection.
- Conversational mode as an alternative to the blank page. On stuck days, I talk to the AI agent instead of staring at a cursor. It asks questions, I respond, it drafts something I can edit.
- The agent can help me restructure and find coherency in entries where my thoughts are scattered. Not rewriting for me — helping me find the thread.
- Chats with the agent should encourage and validate that the thoughts I'm sharing aren't vapid. Combat the inner critic in real-time.
- The app tracks entry "richness" (not length) and occasionally invites me to add depth to lightweight entries — but never blocks or shames.

#### 2. 🌀 Entries lose focus and spiral into abstraction

I get pulled into sorting out *why* things are the way they are. The entry becomes a swirl of cognitive processing that says nothing. Concrete entries — specific moments, specific feelings — age much better on re-read.

**How `nocturnal` addresses this:**
- AI agent tuned to steer toward specifics. If I'm spiraling, it asks "what actually happened?" or "what did that feel like in the moment?"
- Entry prompts favor concrete questions over open-ended ones.
- Doesn't prevent abstract reflection, but treats it as one mode among many rather than the default.

#### 3. 📋 Journaling becomes a chore, then gets abandoned

When entries feel rote — just checking a box — the habit dies. Every system I've tried has hit this wall.

**How `nocturnal` addresses this:**
- Variety: written entries, photos, conversations, mood tags, reviews, dream logs, recollections.
- Context-based nudges instead of time-based reminders. The app notices signals (Disciplan tasks, conversations, calendar) and suggests relevant entry types. No daily "time to journal!" push notification.
- "On This Day" resurfacing. Opening the app to a memory from two years ago is more engaging than opening it to a blank page.

#### 4. ☀️ I drift away when life is good

I journal more when I'm struggling, less when things are going well. This makes journaling feel heavy.

**How `nocturnal` addresses this:**
- Memory capture mode: quick photo + caption, recipe logs, reviews. These are naturally appealing during good times.
- Disciplan integration surfaces accomplishments as journaling prompts, not just problems to process.
- "On This Day" gives a reason to open the app even with nothing pressing to write.

#### 5. 🤖 AI tools help with structure but the output doesn't sound like me

Mindsera's AI synthesis was useful for organizing thoughts, but the writing was generic. My own additions were always the most valuable parts.

**How `nocturnal` addresses this:**
- AI drafts written in my voice, trained on my entries and refined by my edits over time.
- Voice-to-entry (V2/V3): talk through thoughts → AI structures into a reflection → I review and approve.
- The AI helps capture and organize, not produce artifacts that feel like a fad.

#### 6. 🪤 The AI becomes a crutch and my own writing atrophies

If it's too easy to let the AI do the work, I'll default to that and lose the muscle of articulating my own thoughts. Central design tension.

**How `nocturnal` addresses this:**
- AI tracks how much it's been doing for me recently. Too many AI-assisted entries → nudge toward direct writing.
- All AI content requires explicit approval.
- Conversational mode draws thoughts *out* of me. The AI asks, I answer, it shapes what I said. My words are the raw material.

#### 7. 🗂️ My journal history is fragmented across apps

Entries scattered across Apple Notes, Day One, memory. No single archive.

**How `nocturnal` addresses this:**
- Import pipeline for Day One (JSON/ZIP) and Apple Notes.
- Deduplication logic (existing exports have significant repetition issues).
- Claude conversation ingestion: export → AI compaction → raw material inbox.
- One place going forward.

#### 8. 🏝️ My journal is disconnected from the rest of my digital life

I'm tracking tasks in Disciplan, planning work, having reflective conversations in Claude. The journal doesn't know about any of it.

**How `nocturnal` addresses this:**
- Disciplan integration: task completions, streaks, focus goals as context.
- Claude conversation ingestion: reflective moments become journal entry seeds.
- The journal is the hub, not another silo.

</details>

---

<details>
<summary><h2>4. Features</h2></summary>

### V1 — Core (MVP)

**Goal:** Something I'd use over Apple Notes or a lapsed Day One subscription.

#### Entry Creation
- Rich text with markdown support
- Photo uploads with captions
- Quick mood/check-in entries
- Entry richness tracking with gentle invitations to enrich

#### Tags & Organization
- Flexible tag system, entries can have multiple tags
- Canonical tags (always visible): Daily Reflection, Recollections, Dream Catcher, Reviews
- Custom tags freely creatable
- Dashboard: tag frequency counts + calendar heatmap per tag
- Calendar view showing entry coverage by day and tag

#### Built-In AI Agent
- Conversational mode (Anthropic API — Sonnet for conversations, Haiku for tagging)
- AI asks grounding questions → drafts reflection in my voice → I review/edit → save
- Style learning from edits over time (evolving system prompt + example entries)
- Optional guided prompts for writer's block days
- Over-reliance detection and nudges toward direct writing
- All AI content requires approval before saving

#### Import Pipeline
- Day One JSON/ZIP import (entries, photos, metadata, dates)
- Apple Notes import (likely requires manual export steps)
- Deduplication and tag mapping

---

### V2 — Integration & Intelligence

#### Claude Conversation Ingestion
- Periodic export of claude.ai history → compaction layer extracts reflections, decisions, memorable details
- Compacted material in "raw material inbox" — surfaced as prompts, not auto-published
- Same pipeline for backfill and ongoing ingestion
- **Cost:** ~$1-2/day heavy days. **Open:** programmatic export access TBD.

#### Disciplan Integration
- Disciplan stays standalone; journal ingests via shared DB / webhooks / polling
- Task completions, streaks, focus goals as context for nudges and prompts

#### On This Day & Reflections
- Surface old entries from same date in past years
- AI theme summaries over time periods
- Passive draw-in when opening the app

#### Context-Based Nudges
- No time-based reminders
- Triggered by: Disciplan completions, calendar events, conversation activity
- Suggests entry type based on recent signals

---

### V3 — Future
- iOS photo library integration
- Voice mode (conversations → transcribed → structured entries)
- Workplan integration
- Multi-user portability

</details>

---

<details>
<summary><h2>5. Architecture</h2></summary>

### Stack
- **Frontend:** React Native + Expo (iOS-first)
- **Backend:** Supabase (Postgres + S3 file storage + auth)
- **AI:** Anthropic API via backend functions. Sonnet for conversations, Haiku for classification.
- **Data:** Cloud, single user

### Retrieval architecture (first-class concern)

The retrieval layer is *the* technical decision for this product. It determines both output quality (does the advisor feel like it knows me?) and economic viability (does cost grow linearly with the archive or stay flat?). Naive "stuff the archive into every prompt" can be 10–50× more expensive than smart retrieval at scale, with worse output quality due to noise.

Open design decisions (Mark-authored, tracked in `decisions.md`):

- Chunking strategy (entry-level vs. paragraph vs. semantic)
- Embedding model
- Hybrid retrieval composition (semantic + keyword + recency + thread-aware)
- Recency weighting curve
- Thread detection method
- Vector store (likely Supabase `pgvector`, confirm)
- Per-call context budget (tokens)

Implementation must wait on these decisions. Prerequisite homework is tracked in `homework.md`.

### Data Model

**Entry:** id, created_at, updated_at, entry_date, title, body (markdown), mood, richness_score, source (manual | ai_assisted | imported | conversation_digest), ai_draft (bool), approved (bool)

**Tag:** id, name, is_canonical (bool), color

**EntryTag:** entry_id, tag_id (many-to-many)

**Media:** id, entry_id, file_url, media_type, caption, created_at

**ConversationDigest:** id, source_date, raw_source_ref, compacted_summary, key_themes, suggested_entry_seeds (JSON), status (pending | reviewed | converted | dismissed)

**DisciplanEvent:** id, event_type, event_data (JSON), timestamp, surfaced_as_prompt (bool)

**StyleProfile:** system_prompt_version, example_entry_refs, edit_history

</details>

---

<details>
<summary><h2>6. Cost Estimates & Cost Architecture</h2></summary>

### Principle

The retrieval architecture is the cost story. Naive "stuff the archive into context" scales linearly with archive size and gets expensive fast. Smart retrieval + aggressive prompt caching keeps per-call cost roughly flat as the archive grows. Choose the latter from day one — refactoring out of the naive path later means re-indexing the whole archive.

### Estimates (single user, V1)

Order-of-magnitude only; pricing changes. Validate against current Anthropic + Supabase pricing before locking decisions.

| Component | Estimate |
|---|---|
| Supabase (DB + file storage) | $5–20 |
| Anthropic API — naive (full archive in context, no caching) | $30–90+/mo, grows with archive |
| Anthropic API — with retrieval + caching | $1–5/mo, roughly flat as archive grows |
| Voice (future, not V1) | TBD |

The gap between the two Anthropic rows is the design difference. Treat the high number as a warning, not a budget.

### Operational guidance for development

- Routine tests / dev iteration: Haiku
- Advisor calls in real flow: Sonnet
- Prompt caching: aggressive from day one (static system prompt + cached archive context + small per-call deltas)

</details>

---

<details>
<summary><h2>7. Open Questions</h2></summary>

Core design questions (Mark-authored, also tracked in `decisions.md`):

1. **Retrieval architecture.** Chunking, embedding model, hybrid retrieval composition, recency weighting, thread detection, per-call context budget.
2. **Advisor voice spec.** When the advisor asks vs. reflects vs. pushes back vs. stays quiet; context-pulling triggers; tone register; question-asking patterns by mode.
3. **Over-reliance — operational definition.** What counts, how it's measured, how it's surfaced without preachiness.

Other open questions:

4. **Anthropic data export automation.** Programmatic access or manual-only? Determines daily ingestion feasibility.
5. **Disciplan integration mechanism.** *Database hosting decided 2026-05-11: shared Supabase project (`decisions.md`).* Still open: how nocturnal reads Disciplan data — direct cross-schema reads, views over disciplan tables, or periodic sync into `nocturnal.disciplan_events`.
6. **AI style learning.** System prompt + curated examples for V1. Revisit later.
7. **Entry date vs. creation date.** Recollections need both. UI handling TBD.
8. **Richness scoring.** What counts as "rich"? Needs definition.
9. **Design language.** Visual direction TBD. Reference apps?
10. **App name.** `nocturnal` is a working title (jour → nuit). Open to change.

</details>

---

<details>
<summary><h2>8. Next Steps</h2></summary>

1. Review and iterate on this spec
2. Resolve the three core design questions (`decisions.md`): retrieval architecture, advisor voice spec, over-reliance definition. Do prerequisite homework first (`homework.md`).
3. Resolve other open questions affecting architecture (Anthropic export, Disciplan data layer)
4. Detail the data model and set up Supabase schema
5. Scaffold the Expo/React Native project
6. Build V1 iteratively: entry creation → tags → dashboard → AI agent (gated on retrieval + voice decisions) → import pipeline
7. Import existing Day One and Notes entries as first real data

</details>

# Mark-authored decisions (register)

Source of truth for which Nocturnal design decisions have been made vs. are still open. Agents working in this repo **MUST** consult this file before assuming defaults on anything listed in `CLAUDE.md` § 0. If a decision is not recorded here, stop and surface the question to Mark — do not pick a "reasonable default."

When a decision moves to `DECIDED`, record date and rationale inline. Re-opening a `DECIDED` item requires explicit acknowledgment.

## Status legend
- **OPEN** — not yet decided; agents must not default
- **DECIDED** — recorded with date and rationale; safe to implement against
- **DEFERRED** — explicitly punted; do not implement without re-opening

---

## Infrastructure (DECIDED — verified 2026-05-11)

| Decision | Status | Notes |
|---|---|---|
| Database hosting | **DECIDED** | Shared Supabase project with Disciplan (`mjuannepfodstbsxweuc`). Nocturnal lives in the `nocturnal` schema; Disciplan in its own. Schema namespacing isolates the two apps' tables. Verified 2026-05-11: migration `001_initial_schema.sql` applied; 7 tables present; 4 canonical tags seeded. |
| Auth model | **DECIDED** | Single shared user account across both apps. Foreign keys to `auth.users.id` line up directly between schemas — required for FEA-21 (Disciplan integration) to work cleanly. |
| Anthropic API key | **DECIDED** | Reuse the existing project-level `ANTHROPIC_API_KEY` secret already set for Disciplan's `inbound-email` and `daily-insight` Edge Functions. Same human, same Anthropic account, same billing. |
| Schema migration management | **DECIDED** | Nocturnal schema changes go through the Supabase SQL editor manually (not `supabase db push`) until we figure out how to coexist with Disciplan's CLI-managed migration history. Re-open if migration cadence picks up. |

## Disciplan integration (FEA-21, mostly OPEN)

| Decision | Status | Notes |
|---|---|---|
| Cross-app data access mechanism | OPEN | Three candidates: (1) direct cross-schema reads from nocturnal queries (couples schemas), (2) views in `nocturnal` schema selecting from `disciplan` tables (stable interface, decouples), (3) periodic sync into existing `nocturnal.disciplan_events` table (decoupled, duplicated data). Doesn't block today's verification work. |

## Retrieval architecture (blocks INF-04, FEA-05, FEA-07, FEA-08, FEA-30)

| Decision | Status | Notes |
|---|---|---|
| Chunking strategy (entry-level vs. paragraph vs. semantic) | OPEN | |
| Embedding model | OPEN | |
| Hybrid retrieval composition (semantic + keyword + recency + thread-aware) | OPEN | |
| Recency weighting curve | OPEN | |
| Thread detection method | OPEN | |
| Vector store | OPEN | Default candidate: Supabase `pgvector` given stack choice. Confirm. |
| Per-call context budget (tokens) | OPEN | |

## Advisor voice and behavior (blocks INF-05, FEA-05)

| Decision | Status | Notes |
|---|---|---|
| When the advisor asks vs. reflects vs. pushes back vs. stays quiet | OPEN | |
| Context-pulling triggers (what surfaces past entries, when) | OPEN | |
| Tone register (warm / direct / Socratic / etc.) | OPEN | |
| Question-asking patterns by mode (conversational, restructuring, deep processing) | OPEN | |

## Over-reliance detection (blocks INF-06, FEA-10)

| Decision | Status | Notes |
|---|---|---|
| Operational definition (what counts as over-reliance) | OPEN | |
| Measurement (ratio? cadence? content analysis? combination?) | OPEN | |
| Surfacing mechanism (in-flow nudge? weekly review? both?) | OPEN | |

## Archive taxonomy

| Decision | Status | Notes |
|---|---|---|
| Thread detection (emergent vs. user-defined vs. hybrid) | OPEN | |
| Custom tag behavior (free-form? AI-suggested? both?) | OPEN | Canonical tags are fixed. |

## Cost architecture (blocks INF-07)

| Decision | Status | Notes |
|---|---|---|
| Prompt caching strategy (system + archive + deltas) | OPEN | Read Anthropic prompt caching docs before drafting. |

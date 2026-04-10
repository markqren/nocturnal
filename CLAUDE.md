# CLAUDE.md — `nocturnal`

## Project Overview

AI-assisted personal journal app. Mobile-first, single user. Designed around specific journaling failure modes identified over 10+ years of on-and-off journaling across Apple Notes, Day One, and Mindsera.

- **Repo**: https://github.com/markqren/nocturnal
- **Backend**: Supabase (Postgres + S3 file storage + auth)
- **Stack**: React Native + Expo (iOS-first) → Supabase REST API + Anthropic API
- **AI**: Claude Sonnet for conversations/reflections, Haiku for tagging/classification. API calls via backend functions (key not in mobile app).
- **Spec**: See `nocturnal_spec.md` for full product vision, problems & solutions, and architecture decisions.

## Architecture

### Stack
- **Frontend**: React Native with Expo. iOS-first. Native access to camera, photo library, notifications.
- **Backend**: Supabase — Postgres for entries/metadata, S3-compatible storage for photos, built-in auth.
- **AI Layer**: Anthropic API via lightweight backend functions (Supabase Edge Functions or similar). Never expose API key in the mobile app.
- **Data**: Cloud database, single user, no local-first complexity for V1.

### File Structure
```
nocturnal/
├── app/                  # Expo Router screens
├── components/           # Shared React Native components
├── lib/
│   ├── supabase.ts       # Supabase client, auth, helpers
│   ├── ai.ts             # Anthropic API calls (via backend)
│   └── types.ts          # TypeScript types matching DB schema
├── assets/               # Fonts, images
├── supabase/
│   └── functions/        # Edge Functions (AI proxy, conversation compaction)
├── scripts/
│   └── build-roadmap.sh  # Regenerates ROADMAP.md from splits
├── roadmap/
│   ├── ACTIVE.md         # Next Up + Future (primary context for feature work)
│   ├── RELEASES.md       # Release history (add notes here)
│   └── COMPLETED.md      # Completed items (grep FEA-NNN here)
├── ROADMAP.md            # Generated artifact — do NOT edit directly
├── nocturnal_spec.md     # Product spec (vision, problems, features, architecture)
├── CLAUDE.md             # This file
└── README.md
```

## Database Schema

### Core Tables

**entries**
- `id` (uuid, PK)
- `created_at`, `updated_at` (timestamptz)
- `entry_date` (date) — the date the entry is *about* (may differ from created_at for Recollections)
- `title` (text, nullable)
- `body` (text) — markdown
- `mood` (text, nullable)
- `richness_score` (int, nullable) — computed measure of entry depth/variety
- `source` (text) — `manual` | `ai_assisted` | `imported` | `conversation_digest`
- `ai_draft` (bool) — true if AI generated the initial draft
- `approved` (bool) — must be true before entry is "published" (all AI content starts false)

**tags**
- `id` (uuid, PK)
- `name` (text, unique)
- `is_canonical` (bool) — true for Daily Reflection, Recollections, Dream Catcher, Reviews
- `color` (text, nullable)

**entry_tags**
- `entry_id` (uuid, FK → entries)
- `tag_id` (uuid, FK → tags)
- Many-to-many join table.

**media**
- `id` (uuid, PK)
- `entry_id` (uuid, FK → entries)
- `file_url` (text) — Supabase storage URL
- `media_type` (text) — `image/jpeg`, `image/png`, etc.
- `caption` (text, nullable)
- `created_at` (timestamptz)

### Integration Tables

**conversation_digests**
- `id` (uuid, PK)
- `source_date` (date)
- `raw_source_ref` (text) — reference to export file
- `compacted_summary` (text)
- `key_themes` (jsonb)
- `suggested_entry_seeds` (jsonb)
- `status` (text) — `pending` | `reviewed` | `converted` | `dismissed`

**disciplan_events**
- `id` (uuid, PK)
- `event_type` (text)
- `event_data` (jsonb)
- `timestamp` (timestamptz)
- `surfaced_as_prompt` (bool)

### AI Tables

**style_profile**
- `system_prompt_version` (int)
- `example_entry_refs` (uuid[]) — references to entries used as style examples
- `edit_history` (jsonb) — log of edits Mark makes to AI drafts, used for voice learning

## Key Concepts

### The AI Agent
The built-in AI agent is the core differentiator. It serves multiple roles:
1. **Conversational mode**: Asks grounding questions → drafts reflection in Mark's voice → Mark reviews/edits/approves before saving.
2. **Restructuring assist**: Helps find coherency in scattered thoughts without rewriting.
3. **Inner critic combat**: Validates that thoughts have substance. Encouragement, not flattery.
4. **Style learning**: System prompt evolves based on Mark's edits to AI drafts over time.
5. **Over-reliance detection**: Tracks AI-assisted vs. direct-written ratio. Nudges toward direct writing when ratio skews.

**Critical rule**: All AI-generated content requires explicit approval before saving as an entry. No auto-publishing.

### Entry Richness
Not all entries need to be long-form prose, but the app should discourage sustained low-effort patterns. Richness is measured by variety and depth, not word count. A photo with a thoughtful caption is rich. Ten consecutive photo-only posts with no text is a pattern worth nudging on.

### Tag System
- **Canonical tags** (always visible, can't be deleted): Daily Reflection, Recollections, Dream Catcher, Reviews
- **Custom tags**: freely creatable, any name, any color
- Entries can have multiple tags
- Dashboard shows tag frequency + calendar heatmap per tag

### Import Sources
- **Day One**: JSON/ZIP export. Clean format — entries, photos, metadata, journals → tags mapping.
- **Apple Notes**: Messy. Likely HTML or plain text. Known issue: exports have massive content duplication (same paragraph repeated hundreds of times). Deduplication is critical.
- **Claude conversations**: Periodic export → AI compaction → raw material inbox. Not auto-published.
- **Disciplan**: Task completions and goals flow in as context for nudges. Disciplan remains standalone.

## Conventions

### Code Style
- TypeScript throughout (React Native + backend functions)
- Expo Router for navigation
- Supabase JS client for data access
- Tailwind-style utility classes via NativeWind (if adopted) or StyleSheet
- Functional components with hooks

### Naming
- Database: `snake_case` (Postgres convention)
- TypeScript: `camelCase` for variables/functions, `PascalCase` for types/components
- Files: `kebab-case` for non-component files, `PascalCase` for components
- Feature IDs: `FEA-NN`, `INF-NN`, `BUG-NN`, `UI-NN`

### Roadmap Workflow
1. Edit source files in `roadmap/` (ACTIVE.md, RELEASES.md, COMPLETED.md)
2. Run `bash scripts/build-roadmap.sh` to regenerate ROADMAP.md
3. Never edit ROADMAP.md directly
4. When completing items: add release note to RELEASES.md, move item from ACTIVE.md to COMPLETED.md, run build script

---

# Workflow Rules

## 1. Plan Mode Default
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan — don't keep pushing
- Write detailed specs upfront to reduce ambiguity

## 2. Spec Is Source of Truth
- `nocturnal_spec.md` contains the product vision, design philosophy, and architectural decisions
- Before building any feature, check the spec for relevant context
- If a decision contradicts the spec, flag it — don't silently diverge

## 3. AI Agent Design Principles
- The agent scaffolds, never authors. Mark's words are the raw material.
- Validation over flattery. "This has substance" beats "great writing!"
- Restructuring over rewriting. Help find the thread, don't replace it.
- Track everything: AI-assisted ratio, edit patterns, approval rates. Use data to calibrate nudges.

## 4. Verification Before Done
- Never mark a task complete without proving it works
- For UI changes: test on iOS device/simulator
- For data changes: validate against known values
- For AI features: test with real journal content, not lorem ipsum

## 5. Mobile First
- This is primarily a phone app. Every screen must work on iPhone.
- Test touch targets, scroll behavior, keyboard interactions.
- Don't build desktop-first and retrofit.

## 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.

## 7. Roadmap Discipline
- Update roadmap splits when completing items
- Add release notes to `roadmap/RELEASES.md`
- Move completed items from `roadmap/ACTIVE.md` to `roadmap/COMPLETED.md`
- Run `bash scripts/build-roadmap.sh` to regenerate

## Core Principles

- **Simplicity First**: Minimal code for each change. Don't over-engineer.
- **No Laziness**: Find root causes. No temporary fixes.
- **User Is Mark**: Every design decision is for one specific person. Be opinionated.
- **The Archive Matters Most**: The write experience serves the re-read experience. Never lose data.

# Homework log

When an agent gives Mark homework — go learn X before deciding Y — log it here. Don't let it get lost in chat history. Mark updates `Status` when he reports back. Agents should check this file before implementation work on anything in the `Blocking decision` column.

## Status legend
- **PENDING** — not yet read
- **IN PROGRESS** — partially read
- **DONE** — read; ready to decide

---

| Date | Topic | Resource(s) | Blocking decision | Status |
|---|---|---|---|---|
| 2026-05-11 | RAG architectures, embedding models, chunking strategies | TBD — pick canonical resource (Anthropic cookbook + one survey paper) | Retrieval architecture (`decisions.md`) | PENDING |
| 2026-05-11 | Anthropic prompt caching mechanics | https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching | Prompt caching strategy (`decisions.md`) | PENDING |
| 2026-05-11 | Supabase new-format API keys (`sb_publishable_*` / `sb_secret_*`); migrate Disciplan + nocturnal off legacy JWT-based keys once both apps are stable | https://supabase.com/docs/guides/api/api-keys | Migration affects both apps in the shared project — coordinate. Not blocking V1; revisit post-launch. | PENDING |

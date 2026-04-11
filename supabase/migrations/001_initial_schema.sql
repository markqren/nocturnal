-- nocturnal — initial schema
-- Run this in your Supabase SQL editor or via `supabase db push`
--
-- IMPORTANT: After running this migration, go to:
-- Supabase Dashboard → Settings → API → Extra schemas
-- and add "nocturnal" so the REST API can access it.

-- ─── Schema ─────────────────────────────────────────────────────────────────────
create schema if not exists nocturnal;

-- Grant access to Supabase roles
grant usage on schema nocturnal to postgres, anon, authenticated, service_role;

alter default privileges in schema nocturnal
  grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges in schema nocturnal
  grant all on sequences to postgres, anon, authenticated, service_role;

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ─────────────────────────────────────────────────────────────────────
create type nocturnal.entry_source as enum ('manual', 'ai_assisted', 'imported', 'conversation_digest');
create type nocturnal.digest_status as enum ('pending', 'reviewed', 'converted', 'dismissed');

-- ─── Tables ────────────────────────────────────────────────────────────────────

create table nocturnal.entries (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  entry_date    date not null,
  title         text,
  body          text not null default '',
  mood          text,
  richness_score int,
  source        nocturnal.entry_source not null default 'manual',
  ai_draft      boolean not null default false,
  approved      boolean not null default true,
  user_id       uuid not null references auth.users(id) on delete cascade
);

create table nocturnal.journal_tags (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null unique,
  is_canonical boolean not null default false,
  color        text,
  user_id      uuid references auth.users(id) on delete cascade
);

create table nocturnal.entry_journal_tags (
  entry_id uuid not null references nocturnal.entries(id) on delete cascade,
  tag_id   uuid not null references nocturnal.journal_tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table nocturnal.media (
  id         uuid primary key default uuid_generate_v4(),
  entry_id   uuid not null references nocturnal.entries(id) on delete cascade,
  file_url   text not null,
  media_type text not null,
  caption    text,
  created_at timestamptz not null default now()
);

create table nocturnal.conversation_digests (
  id                    uuid primary key default uuid_generate_v4(),
  source_date           date not null,
  raw_source_ref        text,
  compacted_summary     text not null default '',
  key_themes            jsonb not null default '{}',
  suggested_entry_seeds jsonb not null default '[]',
  status                nocturnal.digest_status not null default 'pending',
  user_id               uuid not null references auth.users(id) on delete cascade
);

create table nocturnal.disciplan_events (
  id                  uuid primary key default uuid_generate_v4(),
  event_type          text not null,
  event_data          jsonb not null default '{}',
  timestamp           timestamptz not null default now(),
  surfaced_as_prompt  boolean not null default false,
  user_id             uuid not null references auth.users(id) on delete cascade
);

create table nocturnal.style_profile (
  id                    serial primary key,
  system_prompt_version int not null default 1,
  example_entry_refs    uuid[] not null default '{}',
  edit_history          jsonb not null default '[]',
  user_id               uuid not null references auth.users(id) on delete cascade,
  unique (user_id)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────
create index idx_entries_entry_date on nocturnal.entries(entry_date desc);
create index idx_entries_user_id on nocturnal.entries(user_id);
create index idx_entry_journal_tags_tag_id on nocturnal.entry_journal_tags(tag_id);
create index idx_media_entry_id on nocturnal.media(entry_id);

-- ─── updated_at trigger ─────────────────────────────────────────────────────────
create or replace function nocturnal.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on nocturnal.entries
  for each row execute function nocturnal.update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────────
alter table nocturnal.entries              enable row level security;
alter table nocturnal.journal_tags         enable row level security;
alter table nocturnal.entry_journal_tags   enable row level security;
alter table nocturnal.media                enable row level security;
alter table nocturnal.conversation_digests enable row level security;
alter table nocturnal.disciplan_events     enable row level security;
alter table nocturnal.style_profile        enable row level security;

-- entries
create policy "entries: owner only" on nocturnal.entries
  for all using (auth.uid() = user_id);

-- journal_tags: canonical tags readable by all authenticated users
create policy "journal_tags: owner + canonical read" on nocturnal.journal_tags
  for select using (is_canonical = true or auth.uid() = user_id);

create policy "journal_tags: owner write" on nocturnal.journal_tags
  for insert with check (auth.uid() = user_id);

create policy "journal_tags: owner update" on nocturnal.journal_tags
  for update using (auth.uid() = user_id);

create policy "journal_tags: owner delete" on nocturnal.journal_tags
  for delete using (auth.uid() = user_id and is_canonical = false);

-- entry_journal_tags
create policy "entry_journal_tags: owner only" on nocturnal.entry_journal_tags
  for all using (
    exists (select 1 from nocturnal.entries where id = entry_journal_tags.entry_id and user_id = auth.uid())
  );

-- media
create policy "media: owner only" on nocturnal.media
  for all using (
    exists (select 1 from nocturnal.entries where id = media.entry_id and user_id = auth.uid())
  );

-- other tables
create policy "digests: owner only" on nocturnal.conversation_digests
  for all using (auth.uid() = user_id);

create policy "disciplan: owner only" on nocturnal.disciplan_events
  for all using (auth.uid() = user_id);

create policy "style_profile: owner only" on nocturnal.style_profile
  for all using (auth.uid() = user_id);

-- ─── Seed: Canonical Tags ───────────────────────────────────────────────────────
-- Run this in the SQL editor (service role) — bypasses RLS for seeding
insert into nocturnal.journal_tags (name, is_canonical, color, user_id) values
  ('Daily Reflection', true, '#a78bfa', null),
  ('Recollections',    true, '#60a5fa', null),
  ('Dream Catcher',    true, '#f472b6', null),
  ('Reviews',          true, '#34d399', null);

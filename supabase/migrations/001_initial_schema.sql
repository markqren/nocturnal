-- nocturnal — initial schema
-- Run this in your Supabase SQL editor or via `supabase db push`

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ─────────────────────────────────────────────────────────────────────
create type entry_source as enum ('manual', 'ai_assisted', 'imported', 'conversation_digest');
create type digest_status as enum ('pending', 'reviewed', 'converted', 'dismissed');

-- ─── Tables ────────────────────────────────────────────────────────────────────

create table entries (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  entry_date    date not null,
  title         text,
  body          text not null default '',
  mood          text,
  richness_score int,
  source        entry_source not null default 'manual',
  ai_draft      boolean not null default false,
  approved      boolean not null default true,
  user_id       uuid not null references auth.users(id) on delete cascade
);

create table tags (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null unique,
  is_canonical boolean not null default false,
  color        text,
  user_id      uuid references auth.users(id) on delete cascade
);

create table entry_tags (
  entry_id uuid not null references entries(id) on delete cascade,
  tag_id   uuid not null references tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table media (
  id         uuid primary key default uuid_generate_v4(),
  entry_id   uuid not null references entries(id) on delete cascade,
  file_url   text not null,
  media_type text not null,
  caption    text,
  created_at timestamptz not null default now()
);

create table conversation_digests (
  id                    uuid primary key default uuid_generate_v4(),
  source_date           date not null,
  raw_source_ref        text,
  compacted_summary     text not null default '',
  key_themes            jsonb not null default '{}',
  suggested_entry_seeds jsonb not null default '[]',
  status                digest_status not null default 'pending',
  user_id               uuid not null references auth.users(id) on delete cascade
);

create table disciplan_events (
  id                  uuid primary key default uuid_generate_v4(),
  event_type          text not null,
  event_data          jsonb not null default '{}',
  timestamp           timestamptz not null default now(),
  surfaced_as_prompt  boolean not null default false,
  user_id             uuid not null references auth.users(id) on delete cascade
);

create table style_profile (
  id                    serial primary key,
  system_prompt_version int not null default 1,
  example_entry_refs    uuid[] not null default '{}',
  edit_history          jsonb not null default '[]',
  user_id               uuid not null references auth.users(id) on delete cascade,
  unique (user_id)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────
create index idx_entries_entry_date on entries(entry_date desc);
create index idx_entries_user_id on entries(user_id);
create index idx_entry_tags_tag_id on entry_tags(tag_id);
create index idx_media_entry_id on media(entry_id);

-- ─── updated_at trigger ─────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────────
alter table entries              enable row level security;
alter table tags                 enable row level security;
alter table entry_tags           enable row level security;
alter table media                enable row level security;
alter table conversation_digests enable row level security;
alter table disciplan_events     enable row level security;
alter table style_profile        enable row level security;

-- entries
create policy "entries: owner only" on entries
  for all using (auth.uid() = user_id);

-- tags: canonical tags are readable by all authenticated users
create policy "tags: owner + canonical read" on tags
  for select using (is_canonical = true or auth.uid() = user_id);

create policy "tags: owner write" on tags
  for insert with check (auth.uid() = user_id);

create policy "tags: owner update" on tags
  for update using (auth.uid() = user_id);

create policy "tags: owner delete" on tags
  for delete using (auth.uid() = user_id and is_canonical = false);

-- entry_tags
create policy "entry_tags: owner only" on entry_tags
  for all using (
    exists (select 1 from entries where id = entry_tags.entry_id and user_id = auth.uid())
  );

-- media
create policy "media: owner only" on media
  for all using (
    exists (select 1 from entries where id = media.entry_id and user_id = auth.uid())
  );

-- other tables
create policy "digests: owner only" on conversation_digests
  for all using (auth.uid() = user_id);

create policy "disciplan: owner only" on disciplan_events
  for all using (auth.uid() = user_id);

create policy "style_profile: owner only" on style_profile
  for all using (auth.uid() = user_id);

-- ─── Seed: Canonical Tags ───────────────────────────────────────────────────────
-- Canonical tags have no user_id (shared / system-level)
-- We insert them without user_id; RLS allows reads for is_canonical = true

-- Temporarily bypass RLS for seeding
insert into tags (name, is_canonical, color, user_id) values
  ('Daily Reflection', true, '#a78bfa', null),
  ('Recollections',    true, '#60a5fa', null),
  ('Dream Catcher',    true, '#f472b6', null),
  ('Reviews',          true, '#34d399', null);

-- Note: the user_id = null rows above won't pass the write RLS policy.
-- Run this seed as a service role (SQL editor in Supabase dashboard) or
-- add a service-role bypass policy for seeding.
-- Alternatively, seed canonical tags after first sign-in in the app.

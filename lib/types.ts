// ─── Core Types ────────────────────────────────────────────────────────────────

export type EntrySource = "manual" | "ai_assisted" | "imported" | "conversation_digest";

export interface Entry {
  id: string;
  created_at: string;
  updated_at: string;
  entry_date: string;        // ISO date string (YYYY-MM-DD)
  title: string | null;
  body: string;
  mood: string | null;
  richness_score: number | null;
  source: EntrySource;
  ai_draft: boolean;
  approved: boolean;
  tags?: Tag[];
  media?: Media[];
}

export interface Tag {
  id: string;
  name: string;
  is_canonical: boolean;
  color: string | null;
}

export interface EntryTag {
  entry_id: string;
  tag_id: string;
}

export interface Media {
  id: string;
  entry_id: string;
  file_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

// ─── Integration Types ──────────────────────────────────────────────────────────

export type DigestStatus = "pending" | "reviewed" | "converted" | "dismissed";

export interface ConversationDigest {
  id: string;
  source_date: string;
  raw_source_ref: string;
  compacted_summary: string;
  key_themes: Record<string, unknown>;
  suggested_entry_seeds: Record<string, unknown>;
  status: DigestStatus;
}

export interface DisciplanEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  timestamp: string;
  surfaced_as_prompt: boolean;
}

// ─── AI Types ──────────────────────────────────────────────────────────────────

export interface StyleProfile {
  id: number;
  system_prompt_version: number;
  example_entry_refs: string[];
  edit_history: EditHistoryEntry[];
}

export interface EditHistoryEntry {
  entry_id: string;
  original: string;
  edited: string;
  timestamp: string;
}

// ─── Agent Types ───────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface AgentMessage {
  role: MessageRole;
  content: string;
}

export type AgentModel = "sonnet" | "haiku";

export interface AgentRequest {
  messages: AgentMessage[];
  model?: AgentModel;
  system?: string;
}

export interface AgentResponse {
  content: string;
  model: string;
}

// ─── Supabase DB Schema ─────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: Entry;
        Insert: Omit<Entry, "id" | "created_at" | "updated_at" | "tags" | "media">;
        Update: Partial<Omit<Entry, "id" | "created_at" | "tags" | "media">>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id">;
        Update: Partial<Omit<Tag, "id">>;
      };
      entry_tags: {
        Row: EntryTag;
        Insert: EntryTag;
        Update: EntryTag;
      };
      media: {
        Row: Media;
        Insert: Omit<Media, "id" | "created_at">;
        Update: Partial<Omit<Media, "id" | "entry_id" | "created_at">>;
      };
      conversation_digests: {
        Row: ConversationDigest;
        Insert: Omit<ConversationDigest, "id">;
        Update: Partial<Omit<ConversationDigest, "id">>;
      };
      disciplan_events: {
        Row: DisciplanEvent;
        Insert: Omit<DisciplanEvent, "id">;
        Update: Partial<Omit<DisciplanEvent, "id">>;
      };
      style_profile: {
        Row: StyleProfile;
        Insert: Omit<StyleProfile, "id">;
        Update: Partial<Omit<StyleProfile, "id">>;
      };
    };
  };
}

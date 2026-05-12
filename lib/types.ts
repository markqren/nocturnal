export type EntrySource = "manual" | "ai_assisted" | "imported" | "conversation_digest";

export type Tag = {
  id: string;
  name: string;
  is_canonical: boolean;
  color: string | null;
  user_id: string | null;
};

export type Media = {
  id: string;
  entry_id: string;
  file_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
};

export type EntryTag = {
  entry_id: string;
  tag_id: string;
};

type EntryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  entry_date: string;
  title: string | null;
  body: string;
  mood: string | null;
  richness_score: number | null;
  source: EntrySource;
  ai_draft: boolean;
  approved: boolean;
  user_id: string;
};

export type Entry = EntryRow & {
  journal_tags?: Array<{ tag: Tag }>;
  media?: Media[];
};

export type DigestStatus = "pending" | "reviewed" | "converted" | "dismissed";

export type ConversationDigest = {
  id: string;
  source_date: string;
  raw_source_ref: string | null;
  compacted_summary: string;
  key_themes: Record<string, unknown>;
  suggested_entry_seeds: Record<string, unknown>;
  status: DigestStatus;
  user_id: string;
};

export type DisciplanEvent = {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  timestamp: string;
  surfaced_as_prompt: boolean;
  user_id: string;
};

export type StyleProfile = {
  id: number;
  system_prompt_version: number;
  example_entry_refs: string[];
  edit_history: EditHistoryEntry[];
  user_id: string;
};

export type EditHistoryEntry = {
  entry_id: string;
  original: string;
  edited: string;
  timestamp: string;
};

export type MessageRole = "user" | "assistant";

export type AgentMessage = {
  role: MessageRole;
  content: string;
};

export type AgentModel = "sonnet" | "haiku";

export type AgentRequest = {
  messages: AgentMessage[];
  model?: AgentModel;
  system?: string;
};

export type AgentResponse = {
  content: string;
  model: string;
};

export type Database = {
  nocturnal: {
    Views: {};
    Functions: {};
    Enums: {
      entry_source: EntrySource;
      digest_status: DigestStatus;
    };
    CompositeTypes: {};
    Tables: {
      entries: {
        Row: EntryRow;
        Insert: {
          entry_date: string;
          user_id: string;
          title?: string | null;
          body?: string;
          mood?: string | null;
          richness_score?: number | null;
          source?: EntrySource;
          ai_draft?: boolean;
          approved?: boolean;
        };
        Update: Partial<Omit<EntryRow, "id" | "created_at">>;
        Relationships: [];
      };
      journal_tags: {
        Row: Tag;
        Insert: {
          name: string;
          is_canonical?: boolean;
          color?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Omit<Tag, "id">>;
        Relationships: [];
      };
      entry_journal_tags: {
        Row: EntryTag;
        Insert: EntryTag;
        Update: Partial<EntryTag>;
        Relationships: [];
      };
      media: {
        Row: Media;
        Insert: {
          entry_id: string;
          file_url: string;
          media_type: string;
          caption?: string | null;
        };
        Update: Partial<Omit<Media, "id" | "entry_id" | "created_at">>;
        Relationships: [];
      };
      conversation_digests: {
        Row: ConversationDigest;
        Insert: Omit<ConversationDigest, "id"> & { status?: DigestStatus };
        Update: Partial<Omit<ConversationDigest, "id">>;
        Relationships: [];
      };
      disciplan_events: {
        Row: DisciplanEvent;
        Insert: Omit<DisciplanEvent, "id" | "timestamp"> & { timestamp?: string; surfaced_as_prompt?: boolean };
        Update: Partial<Omit<DisciplanEvent, "id">>;
        Relationships: [];
      };
      style_profile: {
        Row: StyleProfile;
        Insert: Omit<StyleProfile, "id"> & { system_prompt_version?: number };
        Update: Partial<Omit<StyleProfile, "id">>;
        Relationships: [];
      };
    };
  };
};

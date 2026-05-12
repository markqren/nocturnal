import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database, Entry, Tag, Media } from "./types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: "nocturnal" },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Entry Queries ──────────────────────────────────────────────────────────────

export async function getEntries(limit = 50, tagId?: string): Promise<Entry[]> {
  let query = supabase
    .from("entries")
    .select(`*, journal_tags:entry_journal_tags(tag:journal_tags(*)), media(*)`)
    .order("entry_date", { ascending: false })
    .limit(limit);

  if (tagId) {
    // nested-relation filter — not captured by generated types
    query = (query as any).eq("entry_journal_tags.tag_id", tagId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Entry[];
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { data, error } = await supabase
    .from("entries")
    .select(`*, journal_tags:entry_journal_tags(tag:journal_tags(*)), media(*)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Entry;
}

export async function getEntriesForMonth(year: number, month: number): Promise<Entry[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("entries")
    .select("id, entry_date, title, journal_tags:entry_journal_tags(tag:journal_tags(*))")
    .gte("entry_date", start)
    .lt("entry_date", end);
  if (error) throw error;
  return (data ?? []) as unknown as Entry[];
}

export type CreateEntryInput = Omit<
  Database["nocturnal"]["Tables"]["entries"]["Insert"],
  "user_id"
>;

export async function createEntry(entry: CreateEntryInput): Promise<Entry> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("entries")
    .insert({ ...entry, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Entry;
}

export async function updateEntry(
  id: string,
  updates: Database["nocturnal"]["Tables"]["entries"]["Update"]
): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function approveEntry(id: string): Promise<Entry> {
  return updateEntry(id, { approved: true });
}

// ─── Tag Queries ────────────────────────────────────────────────────────────────

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("journal_tags")
    .select("*")
    .order("is_canonical", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Tag[];
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("journal_tags")
    .insert({ name, color: color ?? null, is_canonical: false, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Tag;
}

export async function assignTags(entryId: string, tagIds: string[]): Promise<void> {
  await supabase.from("entry_journal_tags").delete().eq("entry_id", entryId);
  if (tagIds.length === 0) return;
  const { error } = await supabase
    .from("entry_journal_tags")
    .insert(tagIds.map((tag_id) => ({ entry_id: entryId, tag_id })));
  if (error) throw error;
}

export async function getTagCounts(): Promise<{ tag: Tag; count: number }[]> {
  const { data, error } = await supabase
    .from("entry_journal_tags")
    .select("tag:journal_tags(*), entry_id");
  if (error) throw error;
  const counts: Record<string, { tag: Tag; count: number }> = {};
  for (const row of (data ?? []) as any[]) {
    const tag = row.tag as Tag;
    if (!tag) continue;
    if (!counts[tag.id]) counts[tag.id] = { tag, count: 0 };
    counts[tag.id].count++;
  }
  return Object.values(counts).sort((a, b) => b.count - a.count);
}

// ─── Media ──────────────────────────────────────────────────────────────────────

export async function uploadMedia(
  entryId: string,
  uri: string,
  mediaType: string,
  caption?: string
): Promise<Media> {
  const fileName = `${entryId}/${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: mediaType,
  } as any);

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(fileName, formData);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("media")
    .insert({
      entry_id: entryId,
      file_url: urlData.publicUrl,
      media_type: mediaType,
      caption: caption ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Media;
}

import { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { format, parseISO } from "date-fns";
import Markdown from "react-native-markdown-display";
import { getEntry, updateEntry, approveEntry, deleteEntry } from "@/lib/supabase";
import { Entry } from "@/lib/types";
import TagPicker from "@/components/TagPicker";

const markdownStyles = {
  body: { color: "#fafafa", fontSize: 16, lineHeight: 26 },
  paragraph: { marginVertical: 4 },
  heading1: { color: "#fafafa", fontWeight: "700" as const },
  heading2: { color: "#fafafa", fontWeight: "600" as const },
  link: { color: "#a78bfa" },
  blockquote: { borderLeftColor: "#a78bfa", paddingLeft: 12 },
  code_block: { backgroundColor: "#18181b", color: "#a78bfa" },
  fence: { backgroundColor: "#18181b", color: "#a78bfa" },
};

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadEntry();
  }, [id]);

  async function loadEntry() {
    try {
      const data = await getEntry(id);
      setEntry(data);
      setEditBody(data?.body ?? "");
      setEditTitle(data?.title ?? "");
    } catch {
      router.back();
    }
  }

  async function handleApprove() {
    if (!entry) return;
    const updated = await approveEntry(entry.id);
    setEntry({ ...entry, ...updated });
  }

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    try {
      const updated = await updateEntry(entry.id, {
        body: editBody,
        title: editTitle.trim() || null,
      });
      setEntry({ ...entry, ...updated });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert("Delete Entry", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEntry(id);
          router.back();
        },
      },
    ]);
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row gap-4 pr-2">
          {editing ? (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#a78bfa" />
              ) : (
                <Text className="text-accent font-semibold">Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text className="text-accent">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text className="text-red-400">Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [editing, saving]);

  if (!entry) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {/* AI draft approval banner */}
      {entry.ai_draft && !entry.approved && (
        <TouchableOpacity
          onPress={handleApprove}
          className="bg-violet-950 border border-accent rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="text-accent text-xs font-semibold uppercase tracking-wide mb-0.5">
              AI Draft
            </Text>
            <Text className="text-text text-sm">
              Review and tap to approve this entry.
            </Text>
          </View>
          <Text className="text-accent font-semibold">Approve ✓</Text>
        </TouchableOpacity>
      )}

      {/* Date + mood */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-sm">
          {format(parseISO(entry.entry_date), "MMMM d, yyyy")}
        </Text>
        {entry.mood && (
          <Text className="text-muted text-sm">{entry.mood}</Text>
        )}
      </View>

      {/* Title */}
      {editing ? (
        <TextInput
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Title"
          placeholderTextColor="#71717a"
          className="text-text text-xl font-semibold mb-3"
        />
      ) : (
        entry.title && (
          <Text className="text-text text-xl font-semibold mb-3">{entry.title}</Text>
        )
      )}

      {/* Body */}
      {editing ? (
        <TextInput
          value={editBody}
          onChangeText={setEditBody}
          multiline
          className="text-text text-base leading-relaxed min-h-40"
          style={{ textAlignVertical: "top" }}
          autoFocus
        />
      ) : (
        <Markdown style={markdownStyles}>{entry.body}</Markdown>
      )}

      {/* Photos */}
      {(entry.media ?? []).length > 0 && (
        <View className="mt-4 gap-3">
          {(entry.media ?? []).map((m) => (
            <View key={m.id}>
              <Image
                source={{ uri: m.file_url }}
                className="w-full h-60 rounded-2xl"
                resizeMode="cover"
              />
              {m.caption && (
                <Text className="text-muted text-sm mt-1 px-1">{m.caption}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tags */}
      {(entry.journal_tags ?? []).length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-4">
          {(entry.journal_tags ?? []).map(({ tag }) => (
            <View
              key={tag.id}
              className="px-3 py-1 rounded-full border border-border"
            >
              <Text className="text-muted text-xs">{tag.name}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

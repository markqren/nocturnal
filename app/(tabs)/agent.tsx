import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { sendAgentMessage, draftEntryFromConversation, suggestTags } from "@/lib/ai";
import { createEntry, getTags, assignTags } from "@/lib/supabase";
import { AgentMessage } from "@/lib/types";
import { format } from "date-fns";

const OPENING_MESSAGE: AgentMessage = {
  role: "assistant",
  content:
    "Hey. What's on your mind today? We can talk it through, or if you'd rather just write, I can step back.",
};

export default function Agent() {
  const router = useRouter();
  const [messages, setMessages] = useState<AgentMessage[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftMode, setDraftMode] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const userMessage: AgentMessage = { role: "user", content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const response = await sendAgentMessage(updated);
      setMessages([...updated, { role: "assistant", content: response.content }]);
    } catch (err) {
      setMessages([
        ...updated,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  async function generateDraft() {
    setLoading(true);
    try {
      const text = await draftEntryFromConversation(messages);
      setDraft(text);
      setDraftMode(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function saveAsEntry() {
    setSaving(true);
    try {
      const entry = await createEntry({
        body: draft,
        entry_date: format(new Date(), "yyyy-MM-dd"),
        source: "ai_assisted",
        ai_draft: true,
        approved: false,
        title: null,
        mood: null,
      });

      // Auto-tag via Haiku
      const tags = await getTags();
      const tagNames = tags.map((t) => t.name);
      const suggested = await suggestTags(draft, tagNames);
      const matchedIds = tags
        .filter((t) => suggested.includes(t.name))
        .map((t) => t.id);
      if (matchedIds.length > 0) await assignTags(entry.id, matchedIds);

      router.push(`/entry/${entry.id}`);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setMessages([OPENING_MESSAGE]);
    setDraftMode(false);
    setDraft("");
  }

  if (draftMode) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-4 pt-4">
          <Text className="text-muted text-xs uppercase tracking-widest mb-3">
            Draft — review before saving
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            className="flex-1 text-text text-base leading-relaxed bg-surface rounded-2xl p-4"
            style={{ textAlignVertical: "top" }}
            placeholderTextColor="#71717a"
          />
          <View className="gap-3 pt-4 pb-6">
            <TouchableOpacity
              onPress={saveAsEntry}
              disabled={saving}
              className="bg-accent rounded-2xl py-4 items-center"
            >
              {saving ? (
                <ActivityIndicator color="#09090b" />
              ) : (
                <Text className="text-bg font-semibold">Save Entry</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDraftMode(false)}
              className="items-center py-2"
            >
              <Text className="text-muted text-sm">← Back to conversation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View
            className={`mx-4 my-1.5 max-w-[85%] rounded-2xl px-4 py-3 ${
              item.role === "user"
                ? "self-end bg-accent"
                : "self-start bg-surface"
            }`}
          >
            <Text
              className={`text-sm leading-relaxed ${
                item.role === "user" ? "text-bg" : "text-text"
              }`}
            >
              {item.content}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && (
        <View className="px-4 pb-2">
          <ActivityIndicator color="#a78bfa" />
        </View>
      )}

      {messages.length > 3 && (
        <TouchableOpacity
          onPress={generateDraft}
          className="mx-4 mb-2 border border-border rounded-xl py-2.5 items-center"
        >
          <Text className="text-muted text-sm">Draft entry from conversation ✦</Text>
        </TouchableOpacity>
      )}

      <View className="flex-row items-end px-4 pb-4 gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write something…"
          placeholderTextColor="#71717a"
          multiline
          className="flex-1 bg-surface text-text rounded-2xl px-4 py-3 text-sm"
          style={{ maxHeight: 120 }}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity
          onPress={send}
          disabled={loading || !input.trim()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            input.trim() ? "bg-accent" : "bg-surface"
          }`}
        >
          <Text className="text-bg">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

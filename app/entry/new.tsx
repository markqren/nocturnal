import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";
import { createEntry, getTags, assignTags, uploadMedia } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import TagPicker from "@/components/TagPicker";
import MoodPicker from "@/components/MoodPicker";

export default function NewEntry() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ uri: string; caption: string }[]>([]);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [
        ...prev,
        { uri: result.assets[0].uri, caption: "" },
      ]);
    }
  }

  async function save() {
    if (!body.trim() && photos.length === 0) return;
    setSaving(true);
    try {
      const entry = await createEntry({
        title: title.trim() || null,
        body: body.trim(),
        mood,
        entry_date: format(new Date(), "yyyy-MM-dd"),
        source: "manual",
        ai_draft: false,
        approved: true,
      });

      await assignTags(entry.id, selectedTagIds);

      for (const photo of photos) {
        await uploadMedia(entry.id, photo.uri, "image/jpeg", photo.caption || undefined);
      }

      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor="#71717a"
          className="text-text text-xl font-semibold mb-3 py-1"
          returnKeyType="next"
        />

        {/* Body */}
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What happened today? What are you thinking?"
          placeholderTextColor="#52525b"
          multiline
          className="text-text text-base leading-relaxed min-h-40 mb-4"
          style={{ textAlignVertical: "top" }}
          autoFocus
        />

        {/* Photos */}
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {photos.map((photo, i) => (
              <View key={i} className="mr-3">
                <Image
                  source={{ uri: photo.uri }}
                  className="w-28 h-28 rounded-xl"
                />
                <TouchableOpacity
                  onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center"
                >
                  <Text className="text-white text-xs">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Mood */}
        <MoodPicker selected={mood} onChange={setMood} />

        {/* Tags */}
        <TagPicker selectedIds={selectedTagIds} onChange={setSelectedTagIds} />

        {/* Photo attach */}
        <TouchableOpacity
          onPress={pickPhoto}
          className="mt-3 border border-border rounded-xl py-3 items-center"
        >
          <Text className="text-muted text-sm">+ Attach photo</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save button */}
      <View className="px-4 pb-8 pt-2 border-t border-border bg-bg">
        <TouchableOpacity
          onPress={save}
          disabled={saving || (!body.trim() && photos.length === 0)}
          className={`rounded-2xl py-4 items-center ${
            body.trim() || photos.length > 0 ? "bg-accent" : "bg-surface"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#09090b" />
          ) : (
            <Text className={`font-semibold ${body.trim() || photos.length > 0 ? "text-bg" : "text-muted"}`}>
              Save Entry
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

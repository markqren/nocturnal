import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { getTags, createTag } from "@/lib/supabase";
import { Tag } from "@/lib/types";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function TagPicker({ selectedIds, onChange }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    getTags().then(setTags);
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  async function addTag() {
    if (!newName.trim()) return;
    try {
      const tag = await createTag(newName.trim());
      setTags((prev) => [...prev, tag]);
      onChange([...selectedIds, tag.id]);
      setNewName("");
      setAdding(false);
    } catch {
      Alert.alert("Tag already exists");
    }
  }

  const canonical = tags.filter((t) => t.is_canonical);
  const custom = tags.filter((t) => !t.is_canonical);

  return (
    <View className="mb-3">
      <Text className="text-muted text-xs uppercase tracking-widest mb-2">Tags</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {canonical.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              onPress={() => toggle(tag.id)}
              className={`px-3 py-1.5 rounded-full border ${
                selectedIds.includes(tag.id)
                  ? "border-accent bg-violet-950"
                  : "border-border"
              }`}
            >
              <Text
                className={
                  selectedIds.includes(tag.id) ? "text-accent text-sm" : "text-muted text-sm"
                }
              >
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}

          {custom.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              onPress={() => toggle(tag.id)}
              className={`px-3 py-1.5 rounded-full border ${
                selectedIds.includes(tag.id)
                  ? "border-accent bg-violet-950"
                  : "border-border"
              }`}
            >
              <Text
                className={
                  selectedIds.includes(tag.id) ? "text-accent text-sm" : "text-muted text-sm"
                }
              >
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}

          {adding ? (
            <View className="flex-row items-center border border-border rounded-full px-3">
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="tag name"
                placeholderTextColor="#71717a"
                className="text-text text-sm py-1.5 min-w-20"
                autoFocus
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setAdding(false)}>
                <Text className="text-muted ml-2">×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setAdding(true)}
              className="px-3 py-1.5 rounded-full border border-dashed border-border"
            >
              <Text className="text-muted text-sm">+ New</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

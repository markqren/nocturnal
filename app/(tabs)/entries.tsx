import { useState, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getEntries, getTags } from "@/lib/supabase";
import { Entry, Tag } from "@/lib/types";
import EntryCard from "@/components/EntryCard";

export default function Entries() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(tagId?: string) {
    const [fetchedEntries, fetchedTags] = await Promise.all([
      getEntries(100, tagId),
      getTags(),
    ]);
    setEntries(fetchedEntries);
    setTags(fetchedTags);
  }

  useFocusEffect(
    useCallback(() => {
      load(selectedTag ?? undefined);
    }, [selectedTag])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load(selectedTag ?? undefined);
    setRefreshing(false);
  }

  function selectTag(tagId: string | null) {
    setSelectedTag(tagId);
    load(tagId ?? undefined);
  }

  return (
    <View className="flex-1 bg-bg">
      {/* Tag filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-none border-b border-border"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => selectTag(null)}
          className={`px-3 py-1.5 rounded-full border ${
            selectedTag === null
              ? "bg-accent border-accent"
              : "border-border"
          }`}
        >
          <Text className={selectedTag === null ? "text-bg text-sm" : "text-muted text-sm"}>
            All
          </Text>
        </TouchableOpacity>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            onPress={() => selectTag(tag.id)}
            className={`px-3 py-1.5 rounded-full border ${
              selectedTag === tag.id
                ? "bg-accent border-accent"
                : "border-border"
            }`}
          >
            <Text
              className={selectedTag === tag.id ? "text-bg text-sm" : "text-muted text-sm"}
            >
              {tag.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard entry={item} onPress={() => router.push(`/entry/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-muted text-sm">No entries yet.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/entry/new")}
        className="absolute bottom-6 right-6 bg-accent w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-bg text-2xl">+</Text>
      </TouchableOpacity>
    </View>
  );
}

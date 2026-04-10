import { useEffect, useState, useCallback } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getTagCounts, getEntriesForMonth } from "@/lib/supabase";
import { Entry, Tag } from "@/lib/types";
import CalendarHeatmap from "@/components/CalendarHeatmap";

type TagCount = { tag: Tag; count: number };

export default function Dashboard() {
  const router = useRouter();
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();

  async function load() {
    const [counts, entries] = await Promise.all([
      getTagCounts(),
      getEntriesForMonth(today.getFullYear(), today.getMonth() + 1),
    ]);
    setTagCounts(counts);
    setMonthEntries(entries);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const canonicalCounts = tagCounts.filter((tc) => tc.tag.is_canonical);
  const customCounts = tagCounts.filter((tc) => !tc.tag.is_canonical).slice(0, 6);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />
      }
    >
      <View className="px-4 pt-4 pb-8">
        {/* Calendar heatmap */}
        <CalendarHeatmap entries={monthEntries} />

        {/* Canonical tag counts */}
        <Text className="text-muted text-xs uppercase tracking-widest mb-3 mt-6">
          Tag Overview
        </Text>
        <View className="gap-2">
          {canonicalCounts.map(({ tag, count }) => (
            <View
              key={tag.id}
              className="bg-surface rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color ?? "#a78bfa" }}
                />
                <Text className="text-text text-sm">{tag.name}</Text>
              </View>
              <Text className="text-muted text-sm">{count}</Text>
            </View>
          ))}
          {customCounts.map(({ tag, count }) => (
            <View
              key={tag.id}
              className="bg-surface rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color ?? "#71717a" }}
                />
                <Text className="text-text text-sm">{tag.name}</Text>
              </View>
              <Text className="text-muted text-sm">{count}</Text>
            </View>
          ))}
        </View>

        {/* On This Day — V2 placeholder */}
        <Text className="text-muted text-xs uppercase tracking-widest mb-3 mt-6">
          On This Day
        </Text>
        <View className="bg-surface rounded-xl px-4 py-5 items-center">
          <Text className="text-muted text-sm text-center">
            Coming in V2 — entries from this day in past years.
          </Text>
        </View>

        {/* New entry FAB */}
        <TouchableOpacity
          onPress={() => router.push("/entry/new")}
          className="mt-6 bg-accent rounded-2xl py-4 items-center"
        >
          <Text className="text-bg font-semibold text-base">+ New Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

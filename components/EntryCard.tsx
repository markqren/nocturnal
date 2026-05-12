import { TouchableOpacity, View, Text } from "react-native";
import { format, parseISO } from "date-fns";
import { Entry, Tag } from "@/lib/types";

interface Props {
  entry: Entry;
  onPress: () => void;
}

export default function EntryCard({ entry, onPress }: Props) {
  const preview = entry.body.replace(/#+\s/g, "").slice(0, 120);
  const tags: Tag[] = (entry.journal_tags ?? []).map((j) => j.tag);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 my-1.5 bg-surface rounded-2xl px-4 py-4"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-1.5">
        <Text className="text-muted text-xs">
          {format(parseISO(entry.entry_date), "MMM d, yyyy")}
        </Text>
        <View className="flex-row gap-1.5">
          {entry.ai_draft && !entry.approved && (
            <View className="bg-violet-950 rounded-full px-2 py-0.5">
              <Text className="text-accent text-xs">draft</Text>
            </View>
          )}
          {entry.mood && (
            <Text className="text-muted text-xs">{entry.mood}</Text>
          )}
        </View>
      </View>

      {entry.title && (
        <Text className="text-text font-semibold mb-1" numberOfLines={1}>
          {entry.title}
        </Text>
      )}

      {preview ? (
        <Text className="text-muted text-sm leading-5" numberOfLines={2}>
          {preview}
        </Text>
      ) : null}

      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {tags.slice(0, 3).map((tag) => (
            <View
              key={tag.id}
              className="rounded-full px-2 py-0.5 border border-border"
            >
              <Text className="text-muted text-xs">{tag.name}</Text>
            </View>
          ))}
          {tags.length > 3 && (
            <Text className="text-muted text-xs self-center">+{tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

import { View, Text, TouchableOpacity, ScrollView } from "react-native";

export default function ImportHub() {
  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-muted text-xs uppercase tracking-widest mb-4">
        Import Sources
      </Text>

      <View className="gap-3">
        {/* Day One */}
        <View className="bg-surface rounded-2xl p-4">
          <Text className="text-text font-semibold mb-1">Day One</Text>
          <Text className="text-muted text-sm mb-4">
            Export your Day One journal as JSON/ZIP, then run the import script from your terminal.
          </Text>
          <View className="bg-bg rounded-xl p-3">
            <Text className="text-accent text-xs font-mono">
              npx ts-node scripts/import-dayone.ts --file ~/export.zip
            </Text>
          </View>
        </View>

        {/* Apple Notes */}
        <View className="bg-surface rounded-2xl p-4">
          <Text className="text-text font-semibold mb-1">Apple Notes</Text>
          <Text className="text-muted text-sm mb-4">
            Place your exported .md files in{" "}
            <Text className="text-accent font-mono text-xs">data/ios_journal_archive/</Text>
            , then run the import script. Deduplication is applied automatically.
          </Text>
          <View className="bg-bg rounded-xl p-3">
            <Text className="text-accent text-xs font-mono">
              npx ts-node scripts/import-notes.ts
            </Text>
          </View>
        </View>

        {/* Claude conversations — V2 */}
        <View className="bg-surface rounded-2xl p-4 opacity-50">
          <Text className="text-text font-semibold mb-1">Claude Conversations</Text>
          <Text className="text-muted text-sm">Coming in V2 — export → compaction → inbox.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

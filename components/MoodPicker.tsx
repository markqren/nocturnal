import { View, Text, TouchableOpacity, ScrollView } from "react-native";

const MOODS = ["😶", "😔", "😕", "😐", "🙂", "😊", "😄", "😌", "😤", "😩", "🤯", "🥹"];

interface Props {
  selected: string | null;
  onChange: (mood: string | null) => void;
}

export default function MoodPicker({ selected, onChange }: Props) {
  return (
    <View className="mb-3">
      <Text className="text-muted text-xs uppercase tracking-widest mb-2">Mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood}
              onPress={() => onChange(selected === mood ? null : mood)}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                selected === mood ? "bg-surface border border-accent" : "bg-surface"
              }`}
            >
              <Text className="text-xl">{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

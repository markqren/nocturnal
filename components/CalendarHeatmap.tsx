import { View, Text } from "react-native";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  isToday,
} from "date-fns";
import { Entry } from "@/lib/types";

interface Props {
  entries: Entry[];
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarHeatmap({ entries }: Props) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map of date string → has entry
  const entryDates = new Set(entries.map((e) => e.entry_date));

  // Pad start with empty cells
  const startPadding = getDay(monthStart);
  const cells: (Date | null)[] = [
    ...Array(startPadding).fill(null),
    ...days,
  ];

  return (
    <View>
      <Text className="text-muted text-xs uppercase tracking-widest mb-3">
        {format(today, "MMMM yyyy")}
      </Text>

      {/* Day headers */}
      <View className="flex-row mb-1">
        {DAYS.map((d, i) => (
          <Text key={i} className="flex-1 text-center text-muted text-xs">
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (!day) {
            return <View key={`pad-${i}`} className="flex-1 aspect-square" />;
          }
          const dateStr = format(day, "yyyy-MM-dd");
          const hasEntry = entryDates.has(dateStr);
          const todayCell = isToday(day);

          return (
            <View key={dateStr} className="flex-1 aspect-square p-0.5">
              <View
                className={`flex-1 rounded-md items-center justify-center ${
                  hasEntry
                    ? "bg-accent"
                    : todayCell
                    ? "border border-accent"
                    : "bg-surface"
                }`}
              >
                <Text
                  className={`text-xs ${
                    hasEntry ? "text-bg" : todayCell ? "text-accent" : "text-muted"
                  }`}
                >
                  {format(day, "d")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

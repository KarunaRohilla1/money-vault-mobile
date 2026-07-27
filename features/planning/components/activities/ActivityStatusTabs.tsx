import { ScrollView, Text, Pressable } from "react-native";

import { statusFilterLabels, type ActivityStatusFilter } from "@/features/planning/activityPresentation";

interface ActivityStatusTabsProps {
  counts: Record<ActivityStatusFilter, number>;
  selected: ActivityStatusFilter;
  onChange: (filter: ActivityStatusFilter) => void;
}

const filters: ActivityStatusFilter[] = ["pending", "completed", "all"];

export function ActivityStatusTabs({ counts, selected, onChange }: ActivityStatusTabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="w-full gap-2 rounded-xl bg-transparent">
      {filters.map((filter) => {
        const active = selected === filter;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${statusFilterLabels[filter]} ${counts[filter]}`}
            accessibilityState={{ selected: active }}
            className={`h-11 min-w-28 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 ${active ? "bg-brand" : "bg-surface"}`}
            key={filter}
            onPress={() => onChange(filter)}
          >
            <Text className={`font-sans text-sm font-semibold ${active ? "text-text-inverse" : "text-text"}`}>{statusFilterLabels[filter]}</Text>
            <Text className={`rounded-full px-2 py-0.5 font-sans text-xs font-bold ${active ? "bg-white/25 text-text-inverse" : "bg-background-muted text-text-muted"}`}>{counts[filter]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

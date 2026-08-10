import { Text, View } from "react-native";

import { cn } from "@/lib/cn";

interface InboxBadgeProps {
  className?: string;
  count: number;
}

export function InboxBadge({ className, count }: InboxBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <View className={cn("absolute -right-1 -top-1 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5", className)}>
      <Text className="font-sans text-[10px] font-bold text-text-inverse">{label}</Text>
    </View>
  );
}

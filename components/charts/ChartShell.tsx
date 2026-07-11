import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

interface ChartShellProps extends PropsWithChildren {
  title: string;
}

export function ChartShell({ title, children }: ChartShellProps) {
  return (
    <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
      <Text className="font-sans text-base font-semibold text-text">{title}</Text>
      {children}
    </View>
  );
}

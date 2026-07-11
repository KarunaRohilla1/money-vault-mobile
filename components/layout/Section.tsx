import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

interface SectionProps extends PropsWithChildren {
  title: string;
  action?: ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-lg font-semibold text-text">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

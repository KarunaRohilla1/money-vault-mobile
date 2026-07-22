import { View } from "react-native";

export function ReportsSkeleton() {
  return (
    <View className="gap-6">
      <View className="h-11 rounded-full bg-surface" />
      <View className="h-48 rounded-xl bg-surface" />
      <View className="gap-3 rounded-xl bg-surface p-4">
        <View className="h-5 w-44 rounded-full bg-surface-pressed" />
        <View className="h-9 rounded-full bg-surface-pressed" />
        <View className="h-9 rounded-full bg-surface-pressed" />
        <View className="h-9 rounded-full bg-surface-pressed" />
      </View>
      <View className="h-48 rounded-xl bg-surface" />
    </View>
  );
}

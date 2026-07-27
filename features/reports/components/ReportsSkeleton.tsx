import { Text, View } from "react-native";

export function ReportsSkeleton() {
  return (
    <View className="gap-5">
      <View className="h-24 rounded-xl bg-surface" />
      <View className="h-12 rounded-lg bg-surface" />
      <View className="flex-row flex-wrap gap-2.5">
        <View className="h-36 basis-[48%] rounded-xl bg-surface" />
        <View className="h-36 basis-[48%] rounded-xl bg-surface" />
        <View className="h-36 basis-[48%] rounded-xl bg-surface" />
        <View className="h-36 basis-[48%] rounded-xl bg-surface" />
      </View>
      <View className="h-80 rounded-xl bg-surface" />
      <View className="h-44 rounded-xl bg-surface" />
    </View>
  );
}

export function ReportsPlaceholder({ title }: { title: string }) {
  return (
    <View className="rounded-xl border border-surface-border bg-surface p-6">
      <Text className="text-center font-sans text-base font-semibold text-text">{title}</Text>
      <Text className="mt-1 text-center font-sans text-sm text-text-muted">This report tab is ready for the next reporting slice.</Text>
    </View>
  );
}
import { Text, View } from "react-native";

interface TagProps {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const toneClasses = {
  neutral: "border-surface-border bg-surface text-text-muted",
  success: "border-state-success bg-background-muted text-state-success",
  warning: "border-state-warning bg-background-muted text-state-warning",
  danger: "border-state-danger bg-background-muted text-state-danger"
};

export function Tag({ label, tone = "neutral" }: TagProps) {
  const [borderClass, backgroundClass, textClass] = toneClasses[tone].split(" ");

  return (
    <View className={`self-start rounded-full border px-3 py-1 ${borderClass} ${backgroundClass}`}>
      <Text className={`font-sans text-xs font-semibold ${textClass}`}>{label}</Text>
    </View>
  );
}

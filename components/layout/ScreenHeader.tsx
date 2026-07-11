import { Text, View } from "react-native";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function ScreenHeader({ eyebrow, title, description }: ScreenHeaderProps) {
  return (
    <View className="gap-2">
      {eyebrow ? <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{eyebrow}</Text> : null}
      <Text className="font-sans text-2xl font-bold text-text">{title}</Text>
      {description ? <Text className="font-sans text-sm text-text-muted">{description}</Text> : null}
    </View>
  );
}

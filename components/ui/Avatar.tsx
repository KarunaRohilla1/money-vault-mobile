import { Text, View } from "react-native";

interface AvatarProps {
  name: string;
}

export function Avatar({ name }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-muted">
      <Text className="font-sans text-sm font-bold text-text">{initials}</Text>
    </View>
  );
}

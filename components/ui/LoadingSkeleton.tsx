import { View } from "react-native";

interface LoadingSkeletonProps {
  variant?: "line" | "card";
}

export function LoadingSkeleton({ variant = "line" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return <View className="h-32 rounded-lg border border-surface-border bg-surface" />;
  }

  return <View className="h-4 rounded-full bg-surface" />;
}

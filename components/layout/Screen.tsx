import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Screen({ children, scroll = true, className, contentClassName }: ScreenProps) {
  const content = <View className={cn("gap-5 px-5 pb-10 pt-4", contentClassName)}>{children}</View>;

  return (
    <SafeAreaView className={cn("flex-1 bg-background", className)} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

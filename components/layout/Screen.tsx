import type { PropsWithChildren } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { theme } from "@/theme";

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({ children, scroll = true, className, contentClassName, onRefresh, refreshing = false }: ScreenProps) {
  const content = <View className={cn("gap-5 px-5 pb-10 pt-4", contentClassName)}>{children}</View>;

  return (
    <SafeAreaView className={cn("flex-1 bg-background", className)} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={theme.colors.brand.soft}
                colors={[theme.colors.brand.soft]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

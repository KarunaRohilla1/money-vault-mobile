import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Pressable, Text } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { InboxCard } from "@/features/inbox/components/InboxCard";
import type { DraftTransactionApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";
import { theme } from "@/theme";

interface SwipeableDraftCardProps {
  currencyCode: CurrencyCode;
  draft: DraftTransactionApi;
  locale: string;
  onApprove: () => void;
  onDelete: () => void;
  onLongPress: () => void;
  onPress: () => void;
  selected: boolean;
  selectionMode: boolean;
}

export function SwipeableDraftCard({
  currencyCode,
  draft,
  locale,
  onApprove,
  onDelete,
  onLongPress,
  onPress,
  selected,
  selectionMode
}: SwipeableDraftCardProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  if (selectionMode) {
    return (
      <InboxCard
        currencyCode={currencyCode}
        draft={draft}
        locale={locale}
        selected={selected}
        onLongPress={onLongPress}
        onPress={onPress}
      />
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={(_progress, dragX) => {
        const scale = dragX.interpolate({
          inputRange: [0, 80],
          outputRange: [0.85, 1],
          extrapolate: "clamp"
        });

        return (
          <Animated.View style={{ transform: [{ scale }] }} className="mr-2 justify-center">
            <Pressable
              accessibilityLabel="Approve draft"
              accessibilityRole="button"
              className="h-full min-w-24 items-center justify-center rounded-xl bg-state-success px-4"
              onPress={() => {
                swipeableRef.current?.close();
                onApprove();
              }}
            >
              <MaterialCommunityIcons color={theme.colors.text.inverse} name="check" size={theme.icons.md} />
              <Text className="mt-1 font-sans text-xs font-bold text-text-inverse">Approve</Text>
            </Pressable>
          </Animated.View>
        );
      }}
      renderRightActions={(_progress, dragX) => {
        const scale = dragX.interpolate({
          inputRange: [-80, 0],
          outputRange: [1, 0.85],
          extrapolate: "clamp"
        });

        return (
          <Animated.View style={{ transform: [{ scale }] }} className="ml-2 justify-center">
            <Pressable
              accessibilityLabel="Delete draft"
              accessibilityRole="button"
              className="h-full min-w-24 items-center justify-center rounded-xl bg-state-danger px-4"
              onPress={() => {
                swipeableRef.current?.close();
                onDelete();
              }}
            >
              <MaterialCommunityIcons color={theme.colors.text.inverse} name="trash-can-outline" size={theme.icons.md} />
              <Text className="mt-1 font-sans text-xs font-bold text-text-inverse">Delete</Text>
            </Pressable>
          </Animated.View>
        );
      }}
    >
      <InboxCard
        currencyCode={currencyCode}
        draft={draft}
        locale={locale}
        selected={selected}
        onLongPress={onLongPress}
        onPress={onPress}
      />
    </Swipeable>
  );
}

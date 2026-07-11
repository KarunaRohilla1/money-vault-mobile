import type { PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
}

export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-background-inset/80">
        <Pressable className="flex-1" onPress={onClose} />
        <SafeAreaView edges={["bottom"]} className="rounded-t-xl border border-surface-border bg-surface-raised p-5">
          <View className="mb-5 h-1 w-12 self-center rounded-full bg-surface-border" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-sans text-lg font-semibold text-text">{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Close</Text>
            </Pressable>
          </View>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

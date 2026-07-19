import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
  presentation?: "sheet" | "fullScreen";
}

export function BottomSheet({ visible, title, onClose, children, presentation = "sheet" }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const keyboardBehavior = Platform.OS === "ios" ? "padding" : "height";

  if (presentation === "fullScreen") {
    return (
      <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-background" edges={["top", "right", "bottom", "left"]}>
          <KeyboardAvoidingView behavior={keyboardBehavior} className="flex-1" keyboardVerticalOffset={0}>
            <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center rounded-lg bg-surface"
                onPress={onClose}
              >
                <Text className="font-sans text-3xl leading-8 text-text">x</Text>
              </Pressable>
              <View className="items-center">
                <Text className="font-sans text-xl font-bold text-text">{title}</Text>
                <View className="mt-3 h-1 w-16 rounded-full bg-brand" />
              </View>
              <View className="h-12 w-12" />
            </View>
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-5"
              contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={keyboardBehavior} className="flex-1 justify-end bg-background-inset/80" keyboardVerticalOffset={0}>
        <Pressable className="flex-1" onPress={onClose} />
        <SafeAreaView edges={["bottom"]} className="max-h-[88%] rounded-t-xl border border-surface-border bg-surface-raised p-5">
          <View className="mb-5 h-1 w-12 self-center rounded-full bg-surface-border" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-sans text-lg font-semibold text-text">{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Close</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

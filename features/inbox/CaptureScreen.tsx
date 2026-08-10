import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { useCapture } from "@/features/inbox/hooks/useCapture";
import { useClipboard } from "@/features/inbox/hooks/useClipboard";
import { INBOX_COPY } from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { theme } from "@/theme";

export function CaptureScreen() {
  const router = useRouter();
  const capture = useCapture();
  const clipboard = useClipboard();
  const [message, setMessage] = useState("");

  async function handlePasteFromClipboard() {
    const value = await clipboard.readClipboard();

    if (!value.trim()) {
      showToast("Clipboard is empty.");
      return;
    }

    setMessage(value);
  }

  function handleContinue() {
    if (!message.trim()) {
      showToast("Paste or type a transaction message first.");
      return;
    }

    capture.startCapture(message);
  }

  return (
    <Screen contentClassName="gap-6 px-5 pb-10 pt-4">
      <View className="relative items-center gap-3 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, inboxRoutes.root)}
        >
          <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
        </Pressable>
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="file-document-outline" size={36} />
        </View>
        <Text className="font-sans text-2xl font-bold text-text">{INBOX_COPY.captureTitle}</Text>
        <Text className="px-6 text-center font-sans text-sm text-text-muted">{INBOX_COPY.captureSubtitle}</Text>
      </View>

      <View className="relative rounded-xl border border-surface-border bg-surface p-4">
        <TextInput
          className="min-h-36 font-sans text-base leading-6 text-text"
          multiline
          placeholder={INBOX_COPY.capturePlaceholder}
          placeholderTextColor={theme.colors.text.subtle}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
        <Pressable
          accessibilityLabel="Paste from clipboard icon"
          accessibilityRole="button"
          className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-brand-deep"
          onPress={() => void handlePasteFromClipboard()}
        >
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="clipboard-outline" size={theme.icons.md} />
        </Pressable>
      </View>

      <PrimaryButton onPress={handleContinue}>Continue</PrimaryButton>

      <SecondaryButton
        disabled={clipboard.isReading}
        icon="clipboard-outline"
        onPress={() => void handlePasteFromClipboard()}
      >
        {INBOX_COPY.capturePaste}
      </SecondaryButton>

      <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
        <Text className="font-sans text-xs font-bold uppercase text-text-muted">Supported</Text>
        <View className="flex-row flex-wrap gap-2">
          {INBOX_COPY.supportedTypes.map((item) => (
            <View key={item} className="rounded-full border border-surface-border bg-background-muted px-3 py-1.5">
              <Text className="font-sans text-xs font-semibold text-text-muted">{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

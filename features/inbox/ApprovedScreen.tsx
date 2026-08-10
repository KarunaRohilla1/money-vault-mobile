import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton } from "@/components/ui";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import { InboxCard } from "@/features/inbox/components/InboxCard";
import { INBOX_COPY } from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrencyCode } from "@/types/domain";
import { theme } from "@/theme";

export function ApprovedScreen() {
  const router = useRouter();
  const approvedDraft = useCaptureDraftStore((state) => state.approvedDraft);
  const approvedTransactionId = useCaptureDraftStore((state) => state.approvedTransactionId);
  const clearSession = useCaptureDraftStore((state) => state.clearSession);
  const currencyCode = useSettingsStore((state) => state.currencyCode) as CurrencyCode;
  const locale = useSettingsStore((state) => state.locale);

  useEffect(() => {
    if (!approvedDraft || !approvedTransactionId) {
      router.replace(inboxRoutes.root);
    }
  }, [approvedDraft, approvedTransactionId, router]);

  if (!approvedDraft || !approvedTransactionId) {
    return null;
  }

  return (
    <Screen contentClassName="items-center gap-6 px-5 pb-10 pt-16">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-state-success">
        <MaterialCommunityIcons color={theme.colors.text.inverse} name="check" size={48} />
      </View>

      <View className="items-center gap-2">
        <Text className="font-sans text-2xl font-bold text-text">{INBOX_COPY.approvedTitle}</Text>
        <Text className="px-4 text-center font-sans text-sm leading-5 text-text-muted">{INBOX_COPY.approvedMessage}</Text>
      </View>

      <View className="w-full">
        <InboxCard currencyCode={currencyCode} draft={approvedDraft} locale={locale} />
      </View>

      <View className="w-full gap-4">
        <PrimaryButton
          icon="eye-outline"
          onPress={() => {
            const transactionId = approvedTransactionId;
            clearSession();
            router.replace(`/transaction/${transactionId}`);
          }}
        >
          View Transaction
        </PrimaryButton>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearSession();
            router.replace(inboxRoutes.capture);
          }}
        >
          <Text className="text-center font-sans text-sm font-semibold text-brand-soft">Add Another</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

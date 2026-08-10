import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton } from "@/components/ui";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import { DuplicateCard } from "@/features/inbox/components/DuplicateCard";
import { INBOX_COPY } from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { goBackOrReplace } from "@/lib/navigation";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrencyCode } from "@/types/domain";
import { theme } from "@/theme";

export function DuplicateScreen() {
  const router = useRouter();
  const draft = useCaptureDraftStore((state) => state.draft);
  const clearSession = useCaptureDraftStore((state) => state.clearSession);
  const currencyCode = useSettingsStore((state) => state.currencyCode) as CurrencyCode;
  const locale = useSettingsStore((state) => state.locale);

  useEffect(() => {
    if (!draft) {
      router.replace(inboxRoutes.root);
    }
  }, [draft, router]);

  if (!draft) {
    return null;
  }

  return (
    <Screen contentClassName="items-center gap-6 px-5 pb-10 pt-16">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-state-warning/15">
        <MaterialCommunityIcons color={theme.colors.state.warning} name="alert" size={42} />
      </View>

      <View className="items-center gap-2">
        <Text className="font-sans text-2xl font-bold text-text">{INBOX_COPY.duplicateTitle}</Text>
        <Text className="px-4 text-center font-sans text-sm leading-5 text-text-muted">{INBOX_COPY.duplicateBody}</Text>
      </View>

      <View className="w-full">
        <DuplicateCard currencyCode={currencyCode} draft={draft} locale={locale} />
      </View>

      <View className="w-full gap-4">
        <PrimaryButton onPress={() => router.replace(inboxRoutes.review)}>{INBOX_COPY.duplicateImport}</PrimaryButton>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearSession();
            goBackOrReplace(router, inboxRoutes.root);
          }}
        >
          <Text className="text-center font-sans text-sm font-semibold text-text-muted">{INBOX_COPY.duplicateCancel}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

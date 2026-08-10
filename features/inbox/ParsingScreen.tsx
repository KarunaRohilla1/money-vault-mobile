import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ErrorView, PrimaryButton } from "@/components/ui";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import { useParseCaptureMutation } from "@/features/inbox/api";
import { INBOX_COPY, parsingChecklist } from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { ApiClientError } from "@/services/api/client";
import type { DraftTransactionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

export function ParsingScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const rawText = useCaptureDraftStore((state) => state.rawText);
  const setDraft = useCaptureDraftStore((state) => state.setDraft);
  const clearSession = useCaptureDraftStore((state) => state.clearSession);
  const parseMutation = useParseCaptureMutation(token);
  const startedRef = useRef(false);
  const [draft, setLocalDraft] = useState<DraftTransactionApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 450);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    if (!rawText.trim()) {
      router.replace(inboxRoutes.capture);
      return;
    }

    startedRef.current = true;

    void (async () => {
      try {
        const response = await parseMutation.mutateAsync({ rawText });
        const nextDraft = response.draftTransaction;
        setDraft(nextDraft, "create");
        setLocalDraft(nextDraft);

        setTimeout(() => {
          if (nextDraft.duplicate) {
            router.replace(inboxRoutes.duplicate);
            return;
          }

          router.replace(inboxRoutes.review);
        }, 500);
      } catch (parseError) {
        const message =
          parseError instanceof ApiClientError && parseError.isNetworkError
            ? "Network error. Check your connection and try again."
            : parseError instanceof Error
              ? parseError.message
              : "Unable to parse message.";
        setError(message);
      }
    })();
    // Intentionally run once per mount/retry; parseMutation identity is unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, retryToken, router, setDraft]);

  const checklist = parsingChecklist(draft);
  const animatedDoneCount = draft ? checklist.length : Math.min(checklist.length - 1, Math.floor(tick / 1.2));

  if (error) {
    return (
      <Screen contentClassName="gap-6 px-5 pb-10 pt-10">
        <ErrorView
          message={error}
          onRetry={() => {
            startedRef.current = false;
            setError(null);
            setLocalDraft(null);
            setRetryToken((value) => value + 1);
          }}
        />
        <PrimaryButton
          onPress={() => {
            clearSession();
            router.replace(inboxRoutes.capture);
          }}
        >
          Back to Capture
        </PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen contentClassName="items-center gap-8 px-5 pb-10 pt-16">
      <View className="h-36 w-36 items-center justify-center rounded-full border-2 border-brand/30">
        <View className="h-28 w-28 items-center justify-center rounded-full border-2 border-brand/50">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-deep">
            <MaterialCommunityIcons color={theme.colors.brand.soft} name="robot-outline" size={40} />
          </View>
        </View>
      </View>

      <View className="w-full gap-3 rounded-xl border border-surface-border bg-surface p-4">
        {checklist.map((item, index) => {
          const done = Boolean(draft ? item.done : index < animatedDoneCount);
          const active = !draft && index === animatedDoneCount;

          return (
            <View key={item.key} className="flex-row items-center gap-3">
              {done ? (
                <MaterialCommunityIcons color={theme.colors.state.success} name="check-circle" size={theme.icons.md} />
              ) : active ? (
                <ActivityIndicator color={theme.colors.brand.soft} size="small" />
              ) : (
                <MaterialCommunityIcons color={theme.colors.text.subtle} name="circle-outline" size={theme.icons.md} />
              )}
              <Text className={done ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm text-text-muted"}>
                {item.key === "category" && active ? "Analyzing..." : item.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text className="text-center font-sans text-sm text-text-muted">{INBOX_COPY.parsingFooter}</Text>
    </Screen>
  );
}

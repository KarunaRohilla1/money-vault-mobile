import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, PrimaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import { ConfidenceBadge } from "@/features/inbox/components/ConfidenceBadge";
import { ReviewForm } from "@/features/inbox/components/ReviewForm";
import { useCapture } from "@/features/inbox/hooks/useCapture";
import {
  draftOverallConfidence,
  draftToReviewValues,
  INBOX_COPY,
  type ReviewFormValues
} from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { MonthDatePicker } from "@/features/transfers/TransfersScreen";
import { todayLocalIso } from "@/lib/date";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import type { DraftTransactionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type SelectorTarget = "account" | "category" | null;

function draftFormKey(draft: DraftTransactionApi) {
  return `${draft.id ?? "preview"}:${draft.updatedAt ?? draft.createdAt ?? draft.rawText}`;
}

export function ReviewScreen() {
  const router = useRouter();
  const draft = useCaptureDraftStore((state) => state.draft);
  const mode = useCaptureDraftStore((state) => state.mode);

  useEffect(() => {
    if (!draft) {
      router.replace(inboxRoutes.root);
    }
  }, [draft, router]);

  if (!draft) {
    return null;
  }

  return <ReviewScreenContent key={draftFormKey(draft)} draft={draft} mode={mode} />;
}

function ReviewScreenContent({
  draft,
  mode
}: {
  draft: DraftTransactionApi;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const capture = useCapture();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const locale = useSettingsStore((state) => state.locale);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const [values, setValues] = useState<ReviewFormValues>(() => draftToReviewValues(draft));
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(todayLocalIso());

  const accounts = accountsQuery.data ?? [];
  const categories = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    const query = categorySearch.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [categoriesQuery.data, categorySearch]);

  const confidence = draftOverallConfidence(draft);
  const isCreate = mode === "create";

  async function handlePrimary() {
    try {
      if (isCreate) {
        await capture.saveToInbox(values);
        showToast("Saved to inbox.");
        router.replace(inboxRoutes.root);
        return;
      }

      if (!draft.id) {
        showToast("Draft is missing an id.");
        return;
      }

      await capture.approveDraft(draft.id, values);
      router.replace(inboxRoutes.approved);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save draft.");
    }
  }

  return (
    <Screen contentClassName="gap-5 px-5 pb-10 pt-4">
      <View className="relative items-center gap-2 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, isCreate ? inboxRoutes.capture : inboxRoutes.root)}
        >
          <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
        </Pressable>
        <Text className="font-sans text-2xl font-bold text-text">Review Transaction</Text>
        {confidence > 0 ? <ConfidenceBadge confidence={confidence} /> : null}
      </View>

      <ReviewForm
        draft={draft}
        values={values}
        onChange={setValues}
        onSelectAccount={() => setSelectorTarget("account")}
        onSelectCategory={() => setSelectorTarget("category")}
        onSelectDate={() => {
          setDatePickerValue(values.date || todayLocalIso());
          setDatePickerVisible(true);
        }}
      />

      <PrimaryButton
        loading={capture.createPending || capture.approvePending}
        icon={isCreate ? "inbox-arrow-down" : "check-circle-outline"}
        onPress={() => void handlePrimary()}
      >
        {isCreate ? INBOX_COPY.saveToInbox : "Approve Transaction"}
      </PrimaryButton>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (isCreate) {
            capture.clearSession();
          }

          goBackOrReplace(router, inboxRoutes.root);
        }}
      >
        <Text className="text-center font-sans text-sm font-semibold text-text-muted">Cancel</Text>
      </Pressable>

      <BottomSheet
        title={selectorTarget === "account" ? "Select Account" : "Select Category"}
        visible={selectorTarget !== null}
        onClose={() => {
          setSelectorTarget(null);
          setCategorySearch("");
        }}
      >
        <View className="gap-3">
          {selectorTarget === "category" ? (
            <TextInput
              className="h-12 rounded-lg border border-surface-border bg-background px-3 font-sans text-base text-text"
              placeholder="Search categories"
              placeholderTextColor={theme.colors.text.subtle}
              value={categorySearch}
              onChangeText={setCategorySearch}
            />
          ) : null}

          {(selectorTarget === "account" ? accounts : categories).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              className="rounded-lg border border-surface-border bg-surface p-3"
              onPress={() => {
                if (selectorTarget === "account") {
                  setValues((current) => ({
                    ...current,
                    accountId: item.id,
                    accountName: item.name
                  }));
                } else {
                  setValues((current) => ({
                    ...current,
                    categoryId: item.id,
                    categoryName: item.name
                  }));
                }

                setSelectorTarget(null);
                setCategorySearch("");
              }}
            >
              <Text className="font-sans text-sm font-semibold text-text">{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet title="Transaction Date" visible={datePickerVisible} onClose={() => setDatePickerVisible(false)}>
        <MonthDatePicker
          locale={locale}
          selectedDate={datePickerValue}
          setSelectedDate={setDatePickerValue}
          onCancel={() => setDatePickerVisible(false)}
          onConfirm={() => {
            setValues((current) => ({ ...current, date: datePickerValue }));
            setDatePickerVisible(false);
          }}
        />
      </BottomSheet>
    </Screen>
  );
}

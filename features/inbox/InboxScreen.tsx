import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { CaptureCard } from "@/features/inbox/components/CaptureCard";
import { EmptyInbox } from "@/features/inbox/components/EmptyInbox";
import { SwipeableDraftCard } from "@/features/inbox/components/SwipeableDraftCard";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import { useCapture } from "@/features/inbox/hooks/useCapture";
import { useInbox } from "@/features/inbox/hooks/useInbox";
import { INBOX_COPY } from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { ApiClientError } from "@/services/api/client";
import type { DraftTransactionApi } from "@/services/api/types";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrencyCode } from "@/types/domain";
import { theme } from "@/theme";
import { ScrollView, RefreshControl } from "react-native";

function Section({
  children,
  count,
  title
}: {
  children: React.ReactNode;
  count: number;
  title: string;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-xs font-bold uppercase tracking-wide text-text-muted">{title}</Text>
        <View className="rounded-full bg-surface-raised px-2.5 py-1">
          <Text className="font-sans text-xs font-bold text-brand-soft">{count}</Text>
        </View>
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}

export function InboxScreen() {
  const router = useRouter();
  const currencyCode = useSettingsStore((state) => state.currencyCode) as CurrencyCode;
  const locale = useSettingsStore((state) => state.locale);
  const inbox = useInbox();
  const capture = useCapture();
  const setApproved = useCaptureDraftStore((state) => state.setApproved);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allDrafts = useMemo(
    () => [...inbox.needsReview, ...inbox.ready, ...inbox.failed],
    [inbox.failed, inbox.needsReview, inbox.ready]
  );

  const selectedReadyIds = selectedIds.filter((id) => inbox.ready.some((draft) => draft.id === id));
  const showFooter = selectionMode || inbox.ready.length > 0;

  function toggleSelected(draftId: number) {
    setSelectedIds((current) => (current.includes(draftId) ? current.filter((id) => id !== draftId) : [...current, draftId]));
  }

  function enterSelection(draftId: number) {
    setSelectionMode(true);
    setSelectedIds([draftId]);
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  async function handleApprove(draft: DraftTransactionApi) {
    if (!draft.id) {
      return;
    }

    try {
      const response = await capture.approveDraft(draft.id);
      setApproved(response.transactionId, response.draftTransaction);
      router.push(inboxRoutes.approved);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to approve draft.");
    }
  }

  async function handleDelete(draft: DraftTransactionApi) {
    if (!draft.id) {
      return;
    }

    try {
      await capture.deleteDraft(draft.id);
      showToast("Draft deleted.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete draft.");
    }
  }

  async function approveDraftIds(ids: number[]) {
    if (ids.length === 0) {
      showToast("Select ready drafts to approve.");
      return;
    }

    try {
      const results = await capture.approveMany(ids);
      exitSelection();
      const last = results[results.length - 1];

      if (last) {
        setApproved(last.transactionId, last.draftTransaction);
        router.push(inboxRoutes.approved);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to approve drafts.");
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      await capture.deleteMany(selectedIds);
      exitSelection();
      showToast("Selected drafts deleted.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete drafts.");
    }
  }

  function renderDraft(draft: DraftTransactionApi) {
    const draftId = draft.id ?? 0;

    return (
      <SwipeableDraftCard
        key={`${draft.status}:${draftId}:${draft.createdAt ?? draft.rawText}`}
        currencyCode={currencyCode}
        draft={draft}
        locale={locale}
        selected={selectedIds.includes(draftId)}
        selectionMode={selectionMode}
        onApprove={() => void handleApprove(draft)}
        onDelete={() => void handleDelete(draft)}
        onLongPress={() => {
          if (!draft.id) {
            return;
          }

          enterSelection(draft.id);
        }}
        onPress={() => {
          if (!draft.id) {
            return;
          }

          if (selectionMode) {
            toggleSelected(draft.id);
            return;
          }

          capture.openDraftReview(draft);
        }}
      />
    );
  }

  if (inbox.isLoading && !inbox.data) {
    return (
      <SafeAreaView className="flex-1 bg-background px-5 pt-4" edges={["top", "left", "right"]}>
        <LoadingSkeleton />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </SafeAreaView>
    );
  }

  if (inbox.isError && !inbox.data) {
    const message =
      inbox.error instanceof ApiClientError && inbox.error.isNetworkError
        ? "Network error. Check your connection and try again."
        : inbox.error instanceof Error
          ? inbox.error.message
          : "Unable to load inbox.";

    return (
      <SafeAreaView className="flex-1 bg-background px-5 pt-4" edges={["top", "left", "right"]}>
        <ErrorView message={message} onRetry={() => void inbox.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-8 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={inbox.isRefetching}
            tintColor={theme.colors.brand.soft}
            colors={[theme.colors.brand.soft]}
            onRefresh={() => void inbox.refetch()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="relative items-center gap-2 pt-2">
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
            onPress={() => goBackOrReplace(router, "/")}
          >
            <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
          </Pressable>
          {selectionMode ? (
            <Pressable accessibilityRole="button" className="absolute right-0 top-0 z-10 px-2 py-3" onPress={exitSelection}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Cancel</Text>
            </Pressable>
          ) : null}
          <Text className="font-sans text-3xl font-bold text-text">{INBOX_COPY.screenTitle}</Text>
          <Text className="font-sans text-sm text-text-muted">{INBOX_COPY.screenSubtitle}</Text>
        </View>

        <CaptureCard onPress={() => router.push(inboxRoutes.capture)} />

        {allDrafts.length === 0 ? (
          <EmptyInbox />
        ) : (
          <>
            <Section count={inbox.needsReview.length} title={INBOX_COPY.sectionNeedsReview}>
              {inbox.needsReview.map(renderDraft)}
            </Section>
            <Section count={inbox.ready.length} title={INBOX_COPY.sectionReady}>
              {inbox.ready.map(renderDraft)}
            </Section>
            <Section count={inbox.failed.length} title={INBOX_COPY.sectionFailed}>
              {inbox.failed.map(renderDraft)}
            </Section>
          </>
        )}
      </ScrollView>

      {showFooter ? (
        <View className="flex-row gap-3 border-t border-surface-border bg-background px-5 py-4">
          {selectionMode ? (
            <>
              <SecondaryButton className="flex-1" icon="trash-can-outline" onPress={() => void handleDeleteSelected()}>
                {INBOX_COPY.deleteSelected} ({selectedIds.length})
              </SecondaryButton>
              <PrimaryButton className="flex-1" icon="check-circle-outline" onPress={() => void approveDraftIds(selectedReadyIds)}>
                {INBOX_COPY.readyApproveAll} ({selectedReadyIds.length})
              </PrimaryButton>
            </>
          ) : (
            <>
              <SecondaryButton
                className="flex-1"
                icon="trash-can-outline"
                onPress={() => {
                  const ids = allDrafts.map((draft) => draft.id).filter((id): id is number => typeof id === "number");
                  setSelectionMode(true);
                  setSelectedIds(ids);
                }}
              >
                Delete
              </SecondaryButton>
              <PrimaryButton
                className="flex-1"
                icon="check-circle-outline"
                onPress={() => {
                  const readyIds = inbox.ready.map((draft) => draft.id).filter((id): id is number => typeof id === "number");
                  void approveDraftIds(readyIds);
                }}
              >
                {INBOX_COPY.readyApproveAll} ({inbox.ready.length})
              </PrimaryButton>
            </>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

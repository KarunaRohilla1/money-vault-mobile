import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { BottomSheet, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  applyBulkAction,
  availableBulkActions,
  closeCycleProgressLabel,
  closeCycleSummary,
  closeItemKey,
  isCloseItemInvalid,
  nextUnresolvedKey,
  type CloseCycleBulkAction
} from "@/features/planning/closeCyclePresentation";
import { CloseCycleItemCard } from "@/features/planning/components/close-cycle/CloseCycleItemCard";
import { CloseCycleLiveSummary } from "@/features/planning/components/close-cycle/CloseCycleLiveSummary";
import type { CloseReviewItem } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface CloseCycleSheetProps {
  currencyCode: string;
  cycleLabel: string;
  error: string | null;
  items: CloseReviewItem[];
  locale: string;
  onChange: (items: CloseReviewItem[]) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  visible: boolean;
}

export function CloseCycleSheet({ currencyCode, cycleLabel, error, items, locale, onChange, onClose, onSubmit, saving, visible }: CloseCycleSheetProps) {
  const [expandedKey, setExpandedKey] = useCloseCycleExpandedKey(items);
  const [bulkVisible, setBulkVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const summary = closeCycleSummary(items);
  const progressPercent = summary.total > 0 ? Math.round((summary.reviewed / summary.total) * 100) : 100;
  const canSubmit = summary.remaining === 0;
  const bulkActions = availableBulkActions(items);
  const shortCycleLabel = cycleLabel.split(" ")[0] ?? cycleLabel;

  function updateItem(index: number, patch: Partial<CloseReviewItem>) {
    const nextItems = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange(nextItems);
    if (!isCloseItemInvalid(nextItems[index]!)) {
      setExpandedKey(nextUnresolvedKey(nextItems, index));
    }
  }

  function applyBulk(action: CloseCycleBulkAction) {
    const nextItems = applyBulkAction(items, action);
    onChange(nextItems);
    setExpandedKey(nextUnresolvedKey(nextItems));
    setBulkVisible(false);
  }

  function submitWithConfirmation() {
    if (!canSubmit) {
      return;
    }
    setConfirmVisible(true);
  }

  return (
    <BottomSheet visible={visible} title={`Close ${cycleLabel} Cycle`} presentation="fullScreen" showHeader={false} onClose={onClose}>
      <View className="gap-5 pb-2">
        <View className="items-center pt-2">
          <View className="h-1 w-16 rounded-full bg-surface-border" />
        </View>

        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1 gap-2">
            <Text className="font-sans text-2xl font-bold text-text">Close {cycleLabel} Cycle</Text>
            <Text className="font-sans text-sm text-text-muted">Review and update all unresolved items to close this cycle.</Text>
          </View>
          <Pressable accessibilityLabel="Close cycle review" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-surface" disabled={saving} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center rounded-lg border border-surface-border bg-surface px-3 py-2">
            <View className="flex-row items-center gap-2 pr-3">
              <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.state.success} />
              <Text className="font-sans text-sm font-semibold text-state-success">{summary.reviewed} Reviewed</Text>
            </View>
            <View className="h-6 w-px bg-surface-border" />
            <Text className="pl-3 font-sans text-sm font-semibold text-brand-soft">{summary.remaining} Remaining</Text>
          </View>
          <View className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-background-muted">
            <View className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className="font-sans text-sm font-bold text-text">{closeCycleProgressLabel(summary)}</Text>
        </View>

        <View className="flex-row items-start gap-2 rounded-xl bg-background-muted px-3 py-3">
          <MaterialCommunityIcons name="information-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
          <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted">Only unresolved items are shown. Completed items are already counted.</Text>
        </View>

        {items.length > 0 ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-sans text-xl font-semibold text-text">Unresolved Items ({items.length})</Text>
            <Pressable accessibilityRole="button" className="flex-row items-center gap-1 rounded-lg px-2 py-2" disabled={saving || bulkActions.length === 0} onPress={() => setBulkVisible(true)}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Bulk actions</Text>
              <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.brand.soft} />
            </Pressable>
          </View>
        ) : null}

        {items.length === 0 ? (
          <View className="items-center gap-2 rounded-xl border border-surface-border bg-surface p-5">
            <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.lg} color={theme.colors.state.success} />
            <Text className="font-sans text-base font-semibold text-text">Everything is ready.</Text>
            <Text className="text-center font-sans text-sm text-text-muted">All activities reviewed.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {items.map((item, index) => {
              const key = closeItemKey(item);
              return (
                <CloseCycleItemCard
                  amount={item.amount}
                  currencyCode={currencyCode}
                  expanded={expandedKey === key}
                  item={item}
                  key={key}
                  locale={locale}
                  shortCycleLabel={shortCycleLabel}
                  onAmountChange={(amount) => updateItem(index, { amount })}
                  onExpand={() => setExpandedKey(expandedKey === key ? null : key)}
                  onActionChange={(action) => updateItem(index, { action })}
                />
              );
            })}
          </View>
        )}

        <CloseCycleLiveSummary currencyCode={currencyCode} locale={locale} summary={summary} />

        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        {!canSubmit ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-brand/10 px-3 py-3">
            <MaterialCommunityIcons name="information" size={theme.icons.sm} color={theme.colors.brand.soft} />
            <Text className="min-w-0 flex-1 font-sans text-sm text-brand-soft">All items must have an action selected to close the cycle.</Text>
          </View>
        ) : null}
        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" disabled={saving} onPress={onClose}>Cancel</SecondaryButton>
          <PrimaryButton className="flex-1" disabled={saving || !canSubmit} loading={saving} onPress={submitWithConfirmation}>
            {canSubmit ? `Close ${shortCycleLabel} Cycle` : `Review ${summary.remaining} remaining`}
          </PrimaryButton>
        </View>
      </View>

      <BulkActionsSheet actions={bulkActions} visible={bulkVisible} onApply={applyBulk} onClose={() => setBulkVisible(false)} />
      <CloseCycleConfirmDialog
        cycleLabel={cycleLabel}
        saving={saving}
        summary={summary}
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          onSubmit();
        }}
      />
    </BottomSheet>
  );
}

function useCloseCycleExpandedKey(items: CloseReviewItem[]) {
  const [expandedKey, setExpandedKey] = useState<string | null>(() => nextUnresolvedKey(items));
  return [expandedKey ?? nextUnresolvedKey(items), setExpandedKey] as const;
}

function BulkActionsSheet({ actions, visible, onApply, onClose }: { actions: CloseCycleBulkAction[]; visible: boolean; onApply: (action: CloseCycleBulkAction) => void; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} title="Bulk actions" onClose={onClose}>
      <View className="gap-2">
        {actions.map((action) => (
          <Pressable accessibilityRole="button" className="min-h-12 justify-center rounded-xl border border-surface-border bg-surface px-4 py-3" key={action} onPress={() => onApply(action)}>
            <Text className="font-sans text-sm font-semibold text-text">{bulkActionLabel(action)}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

function CloseCycleConfirmDialog({ cycleLabel, saving, summary, visible, onCancel, onConfirm }: { cycleLabel: string; saving: boolean; summary: ReturnType<typeof closeCycleSummary>; visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 justify-center bg-background-inset/80 px-5">
        <View className="gap-4 rounded-xl border border-surface-border bg-surface-raised p-5">
          <Text className="font-sans text-lg font-bold text-text">Close {cycleLabel} Cycle?</Text>
          <View className="gap-2">
            <ConfirmLine text="mark the cycle completed" />
            <ConfirmLine text={`carry forward ${summary.carried.count} activities`} />
            <ConfirmLine text={`cancel ${summary.cancelled.count} activities`} />
          </View>
          <Text className="font-sans text-sm text-text-muted">This cannot be undone.</Text>
          <View className="flex-row gap-3">
            <SecondaryButton className="flex-1" disabled={saving} onPress={onCancel}>Cancel</SecondaryButton>
            <PrimaryButton className="flex-1" disabled={saving} loading={saving} onPress={onConfirm}>Close Cycle</PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmLine({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.sm} color={theme.colors.state.success} />
      <Text className="font-sans text-sm text-text">{text}</Text>
    </View>
  );
}

function bulkActionLabel(action: CloseCycleBulkAction) {
  if (action === "markPaid") return "Mark all paid";
  if (action === "markReceived") return "Mark all received";
  if (action === "carryForward") return "Carry all forward";
  return "Clear selections";
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { BottomSheet, CalendarDatePicker, CurrencyText, PrimaryButton } from "@/components/ui";
import { activityDueDate, parseLocalIsoDate, type PlanningActivityViewModel } from "@/features/planning/planningModel";
import { formatIsoDateOnly } from "@/lib/date";
import { theme } from "@/theme";

interface PlanningItemSheetProps {
  activity: PlanningActivityViewModel | null;
  actualAmount: string;
  actualError: string | null;
  actualNotes: string;
  actualPaymentDate: string;
  currencyCode: string;
  cycle: { startMonth: number; startYear: number; startDate?: string; endDate?: string };
  locale: string;
  saving?: boolean;
  selectedStatus: "COMPLETE" | "PENDING" | "CANCELLED";
  onActualAmountChange: (value: string) => void;
  onActualNotesChange: (value: string) => void;
  onActualPaymentDateChange: (value: string) => void;
  onClose: () => void;
  onSaveActual: () => void;
  onStatusChange: (status: "COMPLETE" | "PENDING" | "CANCELLED") => void;
  visible: boolean;
}

export function PlanningItemSheet({
  activity,
  actualAmount,
  actualError,
  actualNotes,
  actualPaymentDate,
  currencyCode,
  cycle,
  locale,
  saving = false,
  selectedStatus,
  onActualAmountChange,
  onActualNotesChange,
  onActualPaymentDateChange,
  onClose,
  onSaveActual,
  onStatusChange,
  visible
}: PlanningItemSheetProps) {
  const completeLabel = activity?.kind === "income" ? "Received" : "Paid";
  const dueDateLabel = activity ? dueDateForActivity(activity, cycle, locale) : "";
  const paymentDateLabel = actualPaymentDate
    ? formatIsoDateOnly(actualPaymentDate, locale, { day: "numeric", month: "short", year: "numeric" })
    : dueDateLabel;
  const currencySymbol = currencySymbolFor(currencyCode, locale);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const isComplete = selectedStatus === "COMPLETE";
  const isCancelled = selectedStatus === "CANCELLED";
  const isPending = selectedStatus === "PENDING";
  const amountMatchesExpected = activity ? Number(actualAmount) === activity.expectedAmount : false;


  return (
    <BottomSheet visible={visible} title="Update Activity" presentation="fullScreen" showHeader={false} onClose={onClose}>
      {activity ? (
        <View className="gap-6 pb-2">
          <View className="items-center gap-3">
            <View className="h-1 w-14 rounded-full bg-brand-soft" />
            <View className="w-full flex-row items-center justify-between">
              <IconButton accessibilityLabel="Close update activity" icon="close" onPress={onClose} />
              <View className="items-center">
                <Text className="font-sans text-xl font-bold text-text">Update Activity</Text>
                <Text className="mt-1 font-sans text-sm text-text-muted">Update the status and amount</Text>
              </View>
              <View className="h-11 w-11" />
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-sans text-2xl font-bold text-text">{activity.name}</Text>
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-sm text-text-muted">{activity.kind === "income" ? "Income" : "Commitment"}</Text>
              {activity.accountName ? <View className="h-1.5 w-1.5 rounded-full bg-brand-soft" /> : null}
              {activity.accountName ? <Text className="font-sans text-sm text-text-muted">{activity.accountName}</Text> : null}
            </View>
          </View>

          <View className="flex-row rounded-xl border border-surface-border bg-surface px-4 py-4">
            <MetricBlock label="Expected">
              <CurrencyText value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
            </MetricBlock>
            <View className="mx-4 w-px bg-surface-border" />
            <MetricBlock label="Due Date">
              <Text className="font-sans text-sm font-semibold text-text">{dueDateLabel}</Text>
            </MetricBlock>
            <View className="mx-4 w-px bg-surface-border" />
            <MetricBlock label="Account">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="bank-outline" size={theme.icons.sm} color={theme.colors.text.muted} />
                <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>{activity.accountName ?? "Not set"}</Text>
              </View>
            </MetricBlock>
          </View>

          <View className="gap-3">
            <Text className="font-sans text-lg font-semibold text-text">Actual Amount</Text>
            <View className="flex-row items-center rounded-xl border border-surface-border bg-surface px-4 py-1">
              <Text className="mr-4 font-sans text-sm font-semibold text-text">{currencySymbol}</Text>
              <TextInput
                className="h-12 min-w-0 flex-1 font-sans text-sm font-semibold text-text"
                keyboardType="decimal-pad"
                onChangeText={onActualAmountChange}
                placeholder="0"
                placeholderTextColor="#8E8AA7"
                value={actualAmount}
              />
              {actualAmount.length > 0 ? (
                <Pressable accessibilityLabel="Clear actual amount" accessibilityRole="button" className="h-10 w-10 items-center justify-center" onPress={() => onActualAmountChange("")}>
                  <MaterialCommunityIcons name="close" size={theme.icons.sm} color={theme.colors.text.muted} />
                </Pressable>
              ) : null}
            </View>
            {actualError ? <Text className="font-sans text-xs font-semibold text-accent-rose">{actualError}</Text> : null}
            <Pressable accessibilityRole="button" className="self-start rounded-lg border border-surface-border bg-surface px-4 py-3" onPress={() => onActualAmountChange(String(activity.expectedAmount))}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Use Expected Amount</Text>
            </Pressable>
            {amountMatchesExpected ? (
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.sm} color={theme.colors.state.success} />
                <Text className="font-sans text-sm font-semibold text-state-success">Amount matches expected amount</Text>
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <Text className="font-sans text-lg font-semibold text-text">Status</Text>
            <View className="flex-row gap-3">
              <StatusPill active={isPending} icon="clock-outline" label="Pending" tone="warning" onPress={() => onStatusChange("PENDING")} />
              <StatusPill active={isComplete} icon="check" label={completeLabel} tone="success" onPress={() => onStatusChange("COMPLETE")} />
              <StatusPill active={isCancelled} icon="close-circle-outline" label="Cancelled" tone="danger" onPress={() => onStatusChange("CANCELLED")} />
            </View>
            <StatusMessage activity={activity} dueDateLabel={dueDateLabel} paymentDateLabel={paymentDateLabel} isCancelled={isCancelled} isComplete={isComplete} />
          </View>

          {isComplete ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-lg font-semibold text-text">
                  {activity.kind === "income" ? "Received Date" : "Payment Date"}
                </Text>
                {datePickerOpen ? (
                  <Pressable accessibilityRole="button" onPress={() => setDatePickerOpen(false)}>
                    <Text className="font-sans text-sm font-semibold text-brand-soft">Done</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose payment date"
                className="flex-row items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-3.5"
                onPress={() => setDatePickerOpen((open) => !open)}
              >
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
                  <Text className="font-sans text-sm font-semibold text-text">{paymentDateLabel}</Text>
                </View>
                <MaterialCommunityIcons
                  name={datePickerOpen ? "chevron-up" : "chevron-down"}
                  size={theme.icons.sm}
                  color={theme.colors.text.muted}
                />
              </Pressable>

              {datePickerOpen ? (
                <View className="rounded-xl border border-surface-border bg-surface p-3">
                  <CalendarDatePicker
                    locale={locale}
                    selectedDate={actualPaymentDate}
                    setSelectedDate={onActualPaymentDateChange}
                    onCancel={() => setDatePickerOpen(false)}
                    onConfirm={() => setDatePickerOpen(false)}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="gap-3">
            <Pressable accessibilityRole="button" className="flex-row items-center justify-between" onPress={() => setNotesExpanded((expanded) => !expanded)}>
              <Text className="font-sans text-lg font-semibold text-text">Notes <Text className="font-sans text-lg font-normal text-text-muted">(optional)</Text></Text>
              <MaterialCommunityIcons name={notesExpanded ? "chevron-up" : "chevron-down"} size={theme.icons.md} color={theme.colors.text.muted} />
            </Pressable>
            {notesExpanded ? (
              <>
                <TextInput
                  className="min-h-28 rounded-xl border border-surface-border bg-surface px-4 py-4 font-sans text-base text-text"
                  multiline
                  onChangeText={onActualNotesChange}
                  placeholder="Add notes"
                  placeholderTextColor="#8E8AA7"
                  textAlignVertical="top"
                  value={actualNotes}
                />
                <Text className="self-end font-sans text-xs text-text-muted">{actualNotes.length}/200</Text>
              </>
            ) : (
              <Pressable accessibilityRole="button" className="flex-row items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-4" onPress={() => setNotesExpanded(true)}>
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons name="plus-box-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
                  <Text className="font-sans text-sm font-semibold text-brand-soft">{actualNotes.trim() ? "View notes" : "Add notes"}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
              </Pressable>
            )}
          </View>

          <PrimaryButton className="mt-2 h-14 rounded-xl" disabled={saving} loading={saving} onPress={onSaveActual}>Save Changes</PrimaryButton>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function IconButton({ accessibilityLabel, icon, onPress }: { accessibilityLabel: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.text.DEFAULT} />
    </Pressable>
  );
}

function MetricBlock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View className="min-w-0 flex-1 gap-2">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      {children}
    </View>
  );
}

function StatusPill({ active, icon, label, onPress, tone }: { active: boolean; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress: () => void; tone: "danger" | "success" | "warning" }) {
  const color = tone === "success" ? theme.colors.state.success : tone === "danger" ? theme.colors.accent.rose : theme.colors.accent.gold;
  const activeClass = tone === "success" ? "border-state-success bg-state-success/15" : tone === "danger" ? "border-accent-rose bg-accent-rose/10" : "border-accent-gold bg-accent-gold/10";
  const textClass = tone === "success" ? "text-state-success" : tone === "danger" ? "text-accent-rose" : "text-accent-gold";

  return (
    <Pressable accessibilityRole="button" className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl border ${active ? activeClass : "border-surface-border bg-surface"}`} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={active ? color : theme.colors.text.muted} />
      <Text className={`font-sans text-sm font-semibold ${active ? textClass : "text-text-muted"}`}>{label}</Text>
    </Pressable>
  );
}

function StatusMessage({ activity, dueDateLabel, isCancelled, isComplete, paymentDateLabel }: { activity: PlanningActivityViewModel; dueDateLabel: string; isCancelled: boolean; isComplete: boolean; paymentDateLabel: string }) {
  const completeLabel = activity.kind === "income" ? "received" : "paid";

  if (isComplete) {
    return (
      <View className="flex-row items-start gap-3 rounded-xl border border-state-success/25 bg-state-success/10 px-4 py-4">
        <MaterialCommunityIcons name="check-circle-outline" size={theme.icons.sm} color={theme.colors.state.success} />
        <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-state-success">This activity will be marked as {completeLabel} on {paymentDateLabel}.</Text>
      </View>
    );
  }

  if (isCancelled) {
    return (
      <View className="flex-row items-start gap-3 rounded-xl border border-accent-rose/25 bg-accent-rose/10 px-4 py-4">
        <MaterialCommunityIcons name="close-circle-outline" size={theme.icons.sm} color={theme.colors.accent.rose} />
        <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-accent-rose">This activity is marked as cancelled.</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4">
      <MaterialCommunityIcons name="information-outline" size={theme.icons.sm} color={theme.colors.accent.gold} />
      <Text className="min-w-0 flex-1 font-sans text-sm text-text">This activity is marked as pending.</Text>
    </View>
  );
}

function dueDateForActivity(activity: PlanningActivityViewModel, cycle: { startMonth: number; startYear: number; startDate?: string; endDate?: string }, locale: string) {
  const dateStr = activityDueDate(activity, cycle);
  const date = parseLocalIsoDate(dateStr);
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function currencySymbolFor(currencyCode: string, locale: string) {
  const symbol = new Intl.NumberFormat(locale, { currency: currencyCode, style: "currency" })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value;

  return symbol ?? currencyCode;
}

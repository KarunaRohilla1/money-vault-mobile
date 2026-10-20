import { Pressable, Text, View } from "react-native";
import { useState } from "react";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { addMonthsToIsoDate, daysInMonth, formatIsoDateOnly, isoDateFromParts, isoDateParts, todayLocalIso } from "@/lib/date";
import { theme } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Abbreviated weekday labels, Sunday-first. */
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function CalendarDatePicker({
  locale,
  onCancel,
  onConfirm,
  selectedDate,
  setSelectedDate
}: {
  locale: string;
  onCancel: () => void;
  onConfirm: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const [pickerMode, setPickerMode] = useState<"days" | "months" | "years">("days");
  const today = todayLocalIso();
  const parts = isoDateParts(selectedDate) ?? isoDateParts(today);
  const monthOptions = Array.from({ length: 12 }, (_v, i) => i + 1);
  const yearOptions = parts ? Array.from({ length: 21 }, (_v, i) => parts.year - 10 + i) : [];

  const monthTitle = parts
    ? formatIsoDateOnly(isoDateFromParts(parts.year, parts.month, 1), locale, { month: "long" })
    : "Month";
  const yearTitle = parts ? String(parts.year) : "Year";

  return (
    <View className="gap-4">
      {/* Month / year navigation header */}
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface"
          onPress={() => setSelectedDate(addMonthsToIsoDate(selectedDate, -1))}
        >
          <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Pressable accessibilityLabel="Select month" accessibilityRole="button" onPress={() => setPickerMode("months")}>
            <Text className="font-sans text-base font-semibold text-brand-soft">{monthTitle}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Select year" accessibilityRole="button" onPress={() => setPickerMode("years")}>
            <Text className="font-sans text-base font-semibold text-brand-soft">{yearTitle}</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface"
          onPress={() => setSelectedDate(addMonthsToIsoDate(selectedDate, 1))}
        >
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>

      {/* Month picker */}
      {pickerMode === "months" && parts ? (
        <View className="flex-row flex-wrap gap-2">
          {monthOptions.map((month) => {
            const isSelected = month === parts.month;
            const date = isoDateFromParts(parts.year, month, Math.min(parts.day, daysInMonth(parts.year, month)));
            return (
              <Pressable
                key={month}
                accessibilityLabel={`Choose ${formatIsoDateOnly(isoDateFromParts(parts.year, month, 1), locale, { month: "long" })}`}
                accessibilityRole="button"
                className={
                  isSelected
                    ? "min-h-10 min-w-[30%] flex-1 items-center justify-center rounded-md bg-brand px-3"
                    : "min-h-10 min-w-[30%] flex-1 items-center justify-center rounded-md border border-surface-border bg-background px-3"
                }
                onPress={() => {
                  setSelectedDate(date);
                  setPickerMode("days");
                }}
              >
                <Text className={isSelected ? "font-sans text-sm font-semibold text-text-inverse" : "font-sans text-sm font-semibold text-text"}>
                  {formatIsoDateOnly(isoDateFromParts(parts.year, month, 1), locale, { month: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Year picker */}
      {pickerMode === "years" && parts ? (
        <View className="flex-row flex-wrap gap-2">
          {yearOptions.map((year) => {
            const isSelected = year === parts.year;
            const date = isoDateFromParts(year, parts.month, Math.min(parts.day, daysInMonth(year, parts.month)));
            return (
              <Pressable
                key={year}
                accessibilityLabel={`Choose ${year}`}
                accessibilityRole="button"
                className={
                  isSelected
                    ? "h-10 min-w-[22%] flex-1 items-center justify-center rounded-md bg-brand px-2"
                    : "h-10 min-w-[22%] flex-1 items-center justify-center rounded-md border border-surface-border bg-background px-2"
                }
                onPress={() => {
                  setSelectedDate(date);
                  setPickerMode("days");
                }}
              >
                <Text className={isSelected ? "font-sans text-sm font-semibold text-text-inverse" : "font-sans text-sm font-semibold text-text"}>
                  {year}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Calendar days grid */}
      {pickerMode === "days" && parts ? (
        <View className="gap-1">
          {/* Weekday header row */}
          <View className="flex-row">
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} className="flex-1 items-center pb-1">
                <Text className="font-sans text-xs font-semibold text-text-muted">{label}</Text>
              </View>
            ))}
          </View>
          {/* Day cells */}
          <CalendarDays
            locale={locale}
            parts={parts}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={setSelectedDate}
          />
        </View>
      ) : null}

      <SecondaryButton onPress={() => setSelectedDate(todayLocalIso())}>Today</SecondaryButton>
      <View className="flex-row gap-2">
        <PrimaryButton className="flex-1" onPress={onConfirm}>
          Select Date
        </PrimaryButton>
        <SecondaryButton className="flex-1" onPress={onCancel}>
          Cancel
        </SecondaryButton>
      </View>
    </View>
  );
}

function CalendarDays({
  locale,
  onSelectDate,
  parts,
  selectedDate,
  today
}: {
  locale: string;
  onSelectDate: (date: string) => void;
  parts: { day: number; month: number; year: number };
  selectedDate: string;
  today: string;
}) {
  const numDays = daysInMonth(parts.year, parts.month);
  // 0 = Sunday, 1 = Monday, …
  const startDow = new Date(parts.year, parts.month - 1, 1).getDay();
  // Total cells = leading blank cells + day cells, rounded up to full weeks
  const totalCells = Math.ceil((startDow + numDays) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - startDow + 1;
    if (dayNumber < 1 || dayNumber > numDays) {
      return null;
    }
    return dayNumber;
  });

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View className="gap-1">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row">
          {row.map((day, colIndex) => {
            if (day === null) {
              return <View key={`blank-${colIndex}`} className="flex-1" />;
            }
            const date = isoDateFromParts(parts.year, parts.month, day);
            const isSelected = date === selectedDate;
            const isToday = date === today;
            return (
              <Pressable
                key={date}
                accessibilityLabel={`Choose ${formatIsoDateOnly(date, locale, { day: "numeric", month: "short", year: "numeric" })}`}
                accessibilityRole="button"
                className={
                  isSelected
                    ? "m-0.5 flex-1 items-center justify-center rounded-full bg-brand py-2"
                    : isToday
                      ? "m-0.5 flex-1 items-center justify-center rounded-full border border-brand py-2"
                      : "m-0.5 flex-1 items-center justify-center rounded-full py-2"
                }
                onPress={() => onSelectDate(date)}
              >
                <Text
                  className={
                    isSelected
                      ? "font-sans text-sm font-semibold text-text-inverse"
                      : isToday
                        ? "font-sans text-sm font-semibold text-brand"
                        : "font-sans text-sm text-text"
                  }
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

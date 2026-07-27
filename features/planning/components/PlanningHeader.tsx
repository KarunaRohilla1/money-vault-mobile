import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Pressable, Text, View } from "react-native";

import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";




import { formatIsoDateOnly } from "@/lib/date";

import type { PlanningApiResponse } from "@/services/api/types";

import { theme } from "@/theme";



interface PlanningHeaderProps {


  locale: string;

  planning: PlanningApiResponse | null;

  onNextCycle?: () => void;

  onOpenCyclePicker?: () => void;

  onPreviousCycle?: () => void;

  canSelectNextCycle?: boolean;

  canSelectPreviousCycle?: boolean;

}



export function PlanningHeader({

  canSelectNextCycle = false,

  canSelectPreviousCycle = false,


  locale,

  onNextCycle,

  onOpenCyclePicker,

  onPreviousCycle,

  planning

}: PlanningHeaderProps) {

  if (!planning) {

    return (

      <View className="gap-3">

        <Text className="font-sans text-3xl font-bold text-text">Planning</Text>

      </View>

    );

  }



  const range = `${formatIsoDateOnly(planning.cycle.startDate, locale, { day: "2-digit", month: "short" })} - ${formatIsoDateOnly(planning.cycle.endDate, locale, { day: "2-digit", month: "short", year: "numeric" })}`;

  const progress = planning.cycleProgress?.progressPercent ?? planning.cycle.progressPercent ?? 0;

  const currentDay = planning.cycleProgress?.currentDay ?? planning.cycle.currentDay ?? 0;

  const totalDays = planning.cycleProgress?.totalDays ?? planning.cycle.totalDays ?? 0;

  return (

    <View className="gap-4">

      <View className="flex-row items-center justify-between gap-3">

        <View>

          <Text className="font-sans text-3xl font-bold text-text">Planning</Text>

          <Text className="font-sans text-sm text-text-muted">Plan • Execute • Close</Text>

        </View>

        <Pressable

          accessibilityLabel="Choose financial cycle"

          accessibilityRole="button"

          className="h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-surface"

          onPress={onOpenCyclePicker}

        >

          <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />

        </Pressable>

      </View>



      <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">

        <View className="flex-row items-start justify-between gap-3">

          <Pressable

            accessibilityLabel="Previous financial cycle"

            accessibilityRole="button"

            className={`h-9 w-9 items-center justify-center rounded-lg bg-background-muted ${canSelectPreviousCycle ? "opacity-100" : "opacity-35"}`}

            disabled={!canSelectPreviousCycle}

            onPress={onPreviousCycle}

          >

            <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />

          </Pressable>

          <Pressable accessibilityLabel="Choose financial cycle" accessibilityRole="button" className="min-w-0 flex-1 items-center" onPress={onOpenCyclePicker}>

            <Text className="text-center font-sans text-2xl font-bold text-text" numberOfLines={1}>{planning.cycle.displayMonth ?? new Date(planning.cycle.startDate).toLocaleDateString(locale, { month: "long", year: "numeric" })}</Text>

            <Text className="mt-1 text-center font-sans text-sm text-text-muted">{range}</Text>

          </Pressable>

          <Pressable

            accessibilityLabel="Next financial cycle"

            accessibilityRole="button"

            className={`h-9 w-9 items-center justify-center rounded-lg bg-background-muted ${canSelectNextCycle ? "opacity-100" : "opacity-35"}`}

            disabled={!canSelectNextCycle}

            onPress={onNextCycle}

          >

            <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />

          </Pressable>

        </View>



        <View className="flex-row items-center justify-between">

          <View className="rounded-full bg-background-muted px-3 py-1.5">

            <Text className="font-sans text-xs font-bold text-brand-soft">{planning.cycle.status}</Text>

          </View>

          <View className="min-w-0 flex-row items-baseline justify-end gap-2">

            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>Day {currentDay} of {totalDays}</Text>

            <Text className="font-sans text-xl font-bold text-text" numberOfLines={1}>{progress}%</Text>

          </View>

        </View>



        <GradientProgressBar progress={progress} />



        <View className="flex-row flex-wrap gap-3">

          <HeaderMetric icon="calendar-start-outline" label="Started" value={planning.cycleProgress?.startLabel ?? planning.cycle.startDate} />


          <HeaderMetric icon="clock-outline" label="Remaining" value={`${planning.cycleProgress?.daysRemaining ?? 0} days`} />


        </View>


      </View>

    </View>

  );

}



function HeaderMetric({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {

  return (

    <View className="min-w-[46%] flex-1 gap-1 rounded-lg bg-background-muted/40 p-3">

      <View className="flex-row items-center gap-2">

        <MaterialCommunityIcons name={icon} size={theme.icons.xs} color={theme.colors.text.muted} />

        <Text className="font-sans text-xs text-text-muted">{label}</Text>

      </View>

      <Text className="font-sans text-base font-bold text-text">{value}</Text>

    </View>

  );

}



function GradientProgressBar({ progress }: { progress: number }) {

  const fillWidth = Math.min(100, Math.max(0, progress));



  return (

    <View className="h-3 overflow-hidden rounded-full bg-background-muted/80">

      <Svg width="100%" height="100%" viewBox="0 0 100 12" preserveAspectRatio="none">

        <Defs>

          <LinearGradient id="planningProgress" x1="0" y1="0" x2="1" y2="0">

            <Stop offset="0" stopColor="#8B5CF6" />

            <Stop offset="0.48" stopColor="#7DD3FC" />

            <Stop offset="1" stopColor="#4ADE80" />

          </LinearGradient>

          <LinearGradient id="planningProgressGlow" x1="0" y1="0" x2="1" y2="0">

            <Stop offset="0" stopColor="#C084FC" stopOpacity="0.55" />

            <Stop offset="0.55" stopColor="#BAE6FD" stopOpacity="0.45" />

            <Stop offset="1" stopColor="#86EFAC" stopOpacity="0.45" />

          </LinearGradient>

        </Defs>

        <Rect x="0" y="0" width="100" height="12" rx="6" fill="#2B2946" opacity="0.88" />

        <Rect x="0" y="1" width={fillWidth} height="10" rx="5" fill="url(#planningProgressGlow)" opacity="0.72" />

        <Rect x="0" y="2" width={fillWidth} height="8" rx="4" fill="url(#planningProgress)" />

      </Svg>

    </View>

  );

}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { IconName } from "@/constants/navigation";
import { theme } from "@/theme";

export function ProgressDots({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${index === currentIndex ? "w-6 bg-brand" : "w-2 bg-surface-border"}`}
        />
      ))}
    </View>
  );
}

export function StepIntro({ centered = false, subtitle, title }: { centered?: boolean; subtitle: string; title: string }) {
  return (
    <View className="gap-2">
      <Text className={`font-sans text-2xl font-bold text-text ${centered ? "text-center" : ""}`}>{title}</Text>
      <Text className={`font-sans text-sm text-text-muted ${centered ? "text-center" : ""}`}>{subtitle}</Text>
    </View>
  );
}

export function IconBadge({ icon }: { icon: IconName }) {
  return (
    <View className="h-20 w-20 items-center justify-center rounded-full border border-brand-soft bg-brand-muted">
      <MaterialCommunityIcons name={icon} size={theme.icons.lg + 10} color={theme.colors.brand.soft} />
    </View>
  );
}

export function IconHero({ icon, success = false }: { icon: IconName; success?: boolean }) {
  return (
    <View className="h-36 w-36 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-muted">
        <MaterialCommunityIcons
          name={icon}
          size={theme.icons.lg + 22}
          color={success ? theme.colors.state.success : theme.colors.brand.soft}
        />
      </View>
    </View>
  );
}

export function FeaturePill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3">
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.brand.soft} />
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
    </View>
  );
}

export function InfoPanel({ body, icon, title }: { body: string; icon: IconName; title: string }) {
  return (
    <View className="flex-row gap-3 rounded-lg border border-surface-border bg-surface p-4">
      <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.accent.gold} />
      <View className="flex-1 gap-1">
        <Text className="font-sans text-sm font-semibold text-text">{title}</Text>
        <Text className="font-sans text-xs text-text-muted">{body}</Text>
      </View>
    </View>
  );
}

export function ChoiceGroup<TValue extends string | number>({
  labelFor,
  meta,
  onSelect,
  options,
  selected
}: {
  labelFor?: (value: TValue) => string;
  meta?: Partial<Record<string, { icon: IconName; subtitle: string }>>;
  onSelect: (value: TValue) => void;
  options: TValue[];
  selected: TValue | null;
}) {
  return (
    <View className="gap-3">
      {options.map((option) => {
        const key = String(option);
        const optionMeta = meta?.[key];
        const active = selected === option;

        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            className={`min-h-20 flex-row items-center rounded-lg border px-4 py-4 ${
              active ? "border-brand-soft bg-surface-raised" : "border-surface-border bg-surface"
            }`}
            onPress={() => onSelect(option)}
          >
            <View className="flex-1 flex-row items-center gap-3">
              {optionMeta ? <MaterialCommunityIcons name={optionMeta.icon} size={theme.icons.lg} color={theme.colors.brand.soft} /> : null}
              <View className="flex-1">
                <Text className="font-sans text-base font-semibold text-text">{labelFor ? labelFor(option) : key}</Text>
                {optionMeta ? <Text className="font-sans text-xs text-text-muted">{optionMeta.subtitle}</Text> : null}
              </View>
              {active ? <MaterialCommunityIcons name="check-circle" size={theme.icons.md} color={theme.colors.brand.soft} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

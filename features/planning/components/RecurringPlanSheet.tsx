import { Text, View } from "react-native";

import { BottomSheet, CurrencyText, EmptyState, SecondaryButton } from "@/components/ui";
import type { PlanningActivityKind } from "@/features/planning/planningModel";
import type { PlanningItemApi } from "@/services/api/types";

interface RecurringPlanSheetProps {
  commitments: PlanningItemApi[];
  currencyCode: string;
  incomeTemplates: PlanningItemApi[];
  locale: string;
  onAdd: (kind: PlanningActivityKind) => void;
  onClose: () => void;
  onDelete: (item: PlanningItemApi, kind: PlanningActivityKind) => void;
  onEdit: (item: PlanningItemApi, kind: PlanningActivityKind) => void;
  visible: boolean;
}

export function RecurringPlanSheet({ commitments, currencyCode, incomeTemplates, locale, onAdd, onClose, onDelete, onEdit, visible }: RecurringPlanSheetProps) {
  return (
    <BottomSheet visible={visible} title="Manage Recurring Plan" onClose={onClose}>
      <View className="gap-5">
        <TemplateGroup
          currencyCode={currencyCode}
          items={incomeTemplates}
          kind="income"
          locale={locale}
          onAdd={onAdd}
          onDelete={onDelete}
          onEdit={onEdit}
          title="Income"
        />
        <TemplateGroup
          currencyCode={currencyCode}
          items={commitments}
          kind="commitment"
          locale={locale}
          onAdd={onAdd}
          onDelete={onDelete}
          onEdit={onEdit}
          title="Commitments"
        />
      </View>
    </BottomSheet>
  );
}

function TemplateGroup({
  currencyCode,
  items,
  kind,
  locale,
  onAdd,
  onDelete,
  onEdit,
  title
}: {
  currencyCode: string;
  items: PlanningItemApi[];
  kind: PlanningActivityKind;
  locale: string;
  onAdd: (kind: PlanningActivityKind) => void;
  onDelete: (item: PlanningItemApi, kind: PlanningActivityKind) => void;
  onEdit: (item: PlanningItemApi, kind: PlanningActivityKind) => void;
  title: string;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-base font-semibold text-text">{title}</Text>
        <SecondaryButton className="h-10 px-3" icon="plus-circle-outline" onPress={() => onAdd(kind)}>
          Add
        </SecondaryButton>
      </View>
      {items.length === 0 ? (
        <EmptyState icon="calendar-check-outline" title={`No ${title.toLowerCase()}`} message="Recurring items will appear here." />
      ) : (
        <View className="rounded-xl bg-surface px-4">
          {items.map((item, index) => (
            <View key={item.id} className={`gap-3 py-3 ${index > 0 ? "border-t border-surface-border" : ""}`}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
                    Due day {item.dueDay}
                    {item.accountName ? ` · ${item.accountName}` : ""}
                  </Text>
                </View>
                <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
              </View>
              <View className="flex-row gap-2">
                <SecondaryButton className="h-10 flex-1 px-3" icon="pencil-outline" onPress={() => onEdit(item, kind)}>
                  Edit
                </SecondaryButton>
                <SecondaryButton className="h-10 flex-1 px-3" icon="delete-outline" onPress={() => onDelete(item, kind)}>
                  Delete
                </SecondaryButton>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

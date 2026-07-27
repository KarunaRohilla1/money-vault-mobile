import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import {
  emptyStateFor,
  filterActivities,
  groupActivities,
  presentActivities,
  sortActivities,
  statusCounts,
  viewOptionsSummary,
  type ActivityGroupMode,
  type ActivitySortMode,
  type ActivityStatusFilter,
  type ActivityTypeFilter
} from "@/features/planning/activityPresentation";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";
import type { PlanningCycleApi } from "@/services/api/types";

import { ActivityEmptyState } from "./ActivityEmptyState";
import { ActivityFilterButton } from "./ActivityFilterButton";
import { ActivityFilterSheet } from "./ActivityFilterSheet";
import { ActivityGroupSection } from "./ActivityGroupSection";
import { ActivityStatusTabs } from "./ActivityStatusTabs";
import { ActivityViewOptionsButton } from "./ActivityViewOptionsButton";
import { ActivityViewOptionsSheet } from "./ActivityViewOptionsSheet";

interface FinancialActivitiesSectionProps {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: PlanningCycleApi;
  locale: string;
  onActivityPress: (activity: PlanningActivityViewModel) => void;
}

export function FinancialActivitiesSection({ activities, currencyCode, cycle, locale, onActivityPress }: FinancialActivitiesSectionProps) {
  const [statusFilter, setStatusFilter] = useState<ActivityStatusFilter>(cycle.status === "Current" ? "pending" : "all");
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("all");
  const [groupMode, setGroupMode] = useState<ActivityGroupMode>("dueDate");
  const [sortMode, setSortMode] = useState<ActivitySortMode>("dueSoonest");
  const [filterVisible, setFilterVisible] = useState(false);
  const [viewOptionsVisible, setViewOptionsVisible] = useState(false);

  const presented = useMemo(() => presentActivities(activities, cycle), [activities, cycle]);
  const billSupported = useMemo(() => presented.some((activity) => activity.presentationType === "bill"), [presented]);
  const counts = useMemo(() => statusCounts(presented), [presented]);
  const groups = useMemo(() => {
    const filtered = filterActivities(presented, statusFilter, typeFilter);
    const sorted = sortActivities(filtered, sortMode);
    return groupActivities(sorted, groupMode, cycle);
  }, [cycle, groupMode, presented, sortMode, statusFilter, typeFilter]);
  const empty = emptyStateFor(statusFilter, typeFilter);

  return (
    <View className="gap-3">
      <Text className="font-sans text-sm font-bold uppercase text-text-muted">Activities</Text>
      <ActivityStatusTabs counts={counts} selected={statusFilter} onChange={setStatusFilter} />
      <View className="flex-row items-center justify-between gap-3">
        <ActivityFilterButton statusFilter={statusFilter} typeFilter={typeFilter} onPress={() => setFilterVisible(true)} />
        <ActivityViewOptionsButton onPress={() => setViewOptionsVisible(true)} />
      </View>
      <Text className="font-sans text-xs text-text-muted">{viewOptionsSummary(groupMode, sortMode)}</Text>
      {groups.length === 0 ? (
        <ActivityEmptyState title={empty.title} message={empty.message} />
      ) : (
        <View className="gap-3">
          {groups.map((group) => (
            <ActivityGroupSection currencyCode={currencyCode} group={group} key={group.key} locale={locale} onActivityPress={onActivityPress} />
          ))}
        </View>
      )}
      <ActivityFilterSheet
        billSupported={billSupported}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
      />
      <ActivityViewOptionsSheet
        groupMode={groupMode}
        sortMode={sortMode}
        visible={viewOptionsVisible}
        onClose={() => setViewOptionsVisible(false)}
        onGroupModeChange={setGroupMode}
        onSortModeChange={setSortMode}
      />
    </View>
  );
}

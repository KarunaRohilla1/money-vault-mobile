import { View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { CloseCycleCard } from "@/features/planning/components/CloseCycleCard";
import { CyclePickerSheet } from "@/features/planning/components/CyclePickerSheet";
import { FinancialActivitiesCard } from "@/features/planning/components/FinancialActivitiesCard";
import { PlanningHeader } from "@/features/planning/components/PlanningHeader";
import { PlanningSheets } from "@/features/planning/components/PlanningSheets";
import { PlanningSummaryCard } from "@/features/planning/components/PlanningSummaryCard";
import { RecurringPlanCard } from "@/features/planning/components/RecurringPlanCard";
import { usePlanningScreen } from "@/features/planning/hooks/usePlanningScreen";

export function PlanningScreen() {
  const planningState = usePlanningScreen();
  const {
    accountsQuery,
    canSelectNextCycle,
    canSelectPreviousCycle,
    closeCardVisible,
    closeCycle,
    completeActivity,
    currencyCode,
    cycleOptions,
    cyclePickerVisible,
    locale,
    openCloseReview,
    openCyclePicker,
    pendingActivities,
    planning,
    planningQuery,
    recurringSummary,
    refresh,
    refreshing,
    selectCycle,
    selectNextCycle,
    selectPreviousCycle,
    selectedCycleStart,
    setCyclePickerVisible,
    setRecurringVisible,
    savingClose,
    statusSaving
  } = planningState;

  if (planningQuery.isLoading && !planning) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader locale={locale} planning={null} />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (planningQuery.isError && !planning) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader locale={locale} planning={null} />
        <ErrorView message="Planning could not be loaded." onRetry={() => void planningQuery.refetch()} />
      </Screen>
    );
  }

  if (!planning || !recurringSummary) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader locale={locale} planning={null} />
        <EmptyState icon="calendar-check-outline" title="No planning data" message="Planning data was not returned for this vault." />
      </Screen>
    );
  }

  return (
    <>
      <Screen contentClassName="gap-6 px-4 pb-24" onRefresh={refresh} refreshing={refreshing}>
        <PlanningHeader
          canSelectNextCycle={canSelectNextCycle}
          canSelectPreviousCycle={canSelectPreviousCycle}
          locale={locale}
          onNextCycle={selectNextCycle}
          onOpenCyclePicker={openCyclePicker}
          onPreviousCycle={selectPreviousCycle}
          planning={planning}
        />

        {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => void accountsQuery.refetch()} /> : null}

        <PlanningSummaryCard currencyCode={currencyCode} locale={locale} totals={planning.totals} />

        <FinancialActivitiesCard
          key={planning.cycle.startDate}
          activities={planningState.activities}
          currencyCode={currencyCode}
          cycle={planning.cycle}
          disabled={statusSaving}
          locale={locale}
          onComplete={completeActivity}
        />

        <View className="h-px bg-surface-border" />

        <RecurringPlanCard
          commitmentCount={recurringSummary.commitmentCount}
          commitmentTotal={recurringSummary.commitmentTotal}
          currencyCode={currencyCode}
          incomeCount={recurringSummary.incomeCount}
          incomeTotal={recurringSummary.incomeTotal}
          locale={locale}
          onManage={() => setRecurringVisible(true)}
        />

        {closeCardVisible ? (
          <CloseCycleCard
            currencyCode={currencyCode}
            locale={locale}
            onClose={openCloseReview}
            pendingCount={planning.closeReadiness?.pendingCount ?? pendingActivities.length}
            projectedSavings={planning.totals.projectedSavings}
            saving={closeCycle.isPending || savingClose}
            totalCount={planning.closeReadiness?.totalCount ?? planningState.activities.length}
          />
        ) : null}
      </Screen>

      <CyclePickerSheet
        cycles={cycleOptions}
        currentCycleStart={planning.cycleNavigation?.currentCycleStart ?? null}
        loading={planningState.cyclePickerQuery.isFetching}
        selectedCycleStart={selectedCycleStart}
        selectedStatus={planningState.cycleStatusFilter}
        selectedYear={planningState.cyclePickerYear}
        visible={cyclePickerVisible}
        onClose={() => setCyclePickerVisible(false)}
        onGoToCurrent={planningState.goToCurrentCycle}
        onNextYear={() => planningState.setCyclePickerYear(planningState.cyclePickerYear + 1)}
        onPreviousYear={() => planningState.setCyclePickerYear(planningState.cyclePickerYear - 1)}
        onSelect={selectCycle}
        onStatusChange={planningState.setCycleStatusFilter}
      />
      <PlanningSheets state={planningState} />
    </>
  );
}

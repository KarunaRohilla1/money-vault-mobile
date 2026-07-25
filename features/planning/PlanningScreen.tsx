import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { CloseCycleCard } from "@/features/planning/components/CloseCycleCard";
import { FinancialActivitiesCard } from "@/features/planning/components/FinancialActivitiesCard";
import { PlanningBottomBar } from "@/features/planning/components/PlanningBottomBar";
import { PlanningHeader } from "@/features/planning/components/PlanningHeader";
import { PlanningSheets } from "@/features/planning/components/PlanningSheets";
import { PlanningSummaryCard } from "@/features/planning/components/PlanningSummaryCard";
import { RecurringPlanCard } from "@/features/planning/components/RecurringPlanCard";
import { UpcomingList } from "@/features/planning/components/UpcomingList";
import { usePlanningScreen } from "@/features/planning/hooks/usePlanningScreen";

export function PlanningScreen() {
  const planningState = usePlanningScreen();
  const {
    accountsQuery,
    closeCardVisible,
    closeCycle,
    completeActivity,
    currencyCode,
    dashboardQuery,
    locale,
    openActivityActions,
    openCloseReview,
    pendingActivities,
    planning,
    planningQuery,
    recurringSummary,
    refresh,
    refreshing,
    setRecurringVisible,
    savingClose,
    statusSaving,
    upcoming
  } = planningState;

  if ((planningQuery.isLoading || dashboardQuery.isLoading) && !planning) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader currencyCode={currencyCode} locale={locale} planning={null} />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (planningQuery.isError && !planning) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader currencyCode={currencyCode} locale={locale} planning={null} />
        <ErrorView message="Planning could not be loaded." onRetry={() => void planningQuery.refetch()} />
      </Screen>
    );
  }

  if (!planning || !recurringSummary) {
    return (
      <Screen contentClassName="gap-5 px-4 pb-24">
        <PlanningHeader currencyCode={currencyCode} locale={locale} planning={null} />
        <EmptyState icon="calendar-check-outline" title="No planning data" message="Planning data was not returned for this vault." />
      </Screen>
    );
  }

  return (
    <>
      <Screen contentClassName="gap-6 px-4 pb-32" onRefresh={refresh} refreshing={refreshing}>
        <PlanningHeader currencyCode={currencyCode} locale={locale} planning={planning} />

        {dashboardQuery.isError ? <ErrorView message="Cycle progress could not be loaded." onRetry={() => void dashboardQuery.refetch()} /> : null}
        {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => void accountsQuery.refetch()} /> : null}

        <PlanningSummaryCard currencyCode={currencyCode} locale={locale} totals={planning.totals} />

        <FinancialActivitiesCard
          activities={planningState.activities}
          currencyCode={currencyCode}
          cycle={planning.cycle}
          disabled={statusSaving}
          locale={locale}
          onComplete={completeActivity}
          onMore={openActivityActions}
        />

        <RecurringPlanCard
          commitmentCount={recurringSummary.commitmentCount}
          commitmentTotal={recurringSummary.commitmentTotal}
          currencyCode={currencyCode}
          incomeCount={recurringSummary.incomeCount}
          incomeTotal={recurringSummary.incomeTotal}
          locale={locale}
          onManage={() => setRecurringVisible(true)}
        />

        <UpcomingList activities={upcoming} currencyCode={currencyCode} cycle={planning.cycle} locale={locale} />

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

      <PlanningBottomBar currencyCode={currencyCode} locale={locale} planning={planning} />
      <PlanningSheets state={planningState} />
    </>
  );
}

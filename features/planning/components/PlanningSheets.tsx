import { CloseCycleSheet } from "@/features/planning/components/CloseCycleSheet";
import { PlanningFormSheet } from "@/features/planning/components/PlanningFormSheet";
import { PlanningItemSheet } from "@/features/planning/components/PlanningItemSheet";
import { RecurringPlanSheet } from "@/features/planning/components/RecurringPlanSheet";
import type { PlanningScreenState } from "@/features/planning/hooks/usePlanningScreen";

interface PlanningSheetsProps {
  state: PlanningScreenState;
}

export function PlanningSheets({ state }: PlanningSheetsProps) {
  const planning = state.planning;

  if (!planning) {
    return null;
  }

  return (
    <>
      <PlanningFormSheet
        accounts={state.accounts}
        error={state.formError}
        form={state.form}
        isSaving={state.isSaving}
        onChange={state.setForm}
        onClose={state.closeForm}
        onSubmit={state.submitForm}
        visible={state.formVisible}
      />

      <PlanningItemSheet
        activity={state.selectedActivity}
        currencyCode={state.currencyCode}
        locale={state.locale}
        onCancel={(activity) => state.setActivityStatus(activity, "CANCELLED")}
        onClose={state.closeActivityActions}
        onReset={(activity) => state.setActivityStatus(activity, "PENDING")}
        visible={state.itemActionsVisible}
      />

      <RecurringPlanSheet
        commitments={planning.commitments}
        currencyCode={state.currencyCode}
        incomeTemplates={planning.incomeTemplates}
        locale={state.locale}
        onAdd={(kind) => {
          state.setRecurringVisible(false);
          state.openAddForm(kind);
        }}
        onClose={() => state.setRecurringVisible(false)}
        onDelete={(item, kind) => (kind === "income" ? state.deleteIncome.mutate(item.id) : state.deleteCommitment.mutate(item.id))}
        onEdit={(item, kind) => {
          state.setRecurringVisible(false);
          state.editItem(item, kind);
        }}
        visible={state.recurringVisible}
      />

      <CloseCycleSheet
        currencyCode={state.currencyCode}
        error={state.closeError}
        items={state.closeItems}
        locale={state.locale}
        onChange={state.setCloseItems}
        onClose={() => state.setCloseVisible(false)}
        onSubmit={() => void state.submitCloseReview()}
        saving={state.savingClose || state.closeCycle.isPending}
        visible={state.closeVisible}
      />
    </>
  );
}

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
        actualAmount={state.actualAmount}
        actualError={state.actualError}
        actualNotes={state.actualNotes}
        currencyCode={state.currencyCode}
        cycle={planning.cycle}
        locale={state.locale}
        saving={state.statusSaving}
        selectedStatus={state.activityDraftStatus}
        onActualAmountChange={state.setActualAmount}
        onActualNotesChange={state.setActualNotes}
        onClose={state.closeActivityActions}
        onSaveActual={state.saveActivityActual}
        onStatusChange={state.setActivityDraftStatus}
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
        cycleLabel={planning.cycle.displayMonth ?? "Current"}
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

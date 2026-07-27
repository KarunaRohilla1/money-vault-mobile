import { FinancialActivitiesSection } from "@/features/planning/components/activities/FinancialActivitiesSection";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";
import type { PlanningCycleApi } from "@/services/api/types";

interface FinancialActivitiesCardProps {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: PlanningCycleApi;
  disabled?: boolean;
  locale: string;
  onComplete: (activity: PlanningActivityViewModel) => void;
}

export function FinancialActivitiesCard({ activities, currencyCode, cycle, locale, onComplete }: FinancialActivitiesCardProps) {
  return (
    <FinancialActivitiesSection
      activities={activities}
      currencyCode={currencyCode}
      cycle={cycle}
      locale={locale}
      onActivityPress={onComplete}
    />
  );
}

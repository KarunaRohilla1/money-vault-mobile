import { hasOutstandingSettlement } from "@/features/dashboard/settlement";
import type { PrimarySharedVaultApi, SafeToSpendBreakdownItemApi, SettlementApi } from "@/services/api/types";

type PrimarySettlementSummary = Pick<SettlementApi, "amount" | "direction" | "label">;

export interface PrimarySharedVaultSettlementCardState {
  amount: number | null;
  canSettle: boolean;
  hasPrimaryVault: boolean;
  primaryVaultName: string;
  subtitle: string;
}

export function primarySharedVaultSettlementCardState({
  isLoading,
  primarySharedVault,
  settlement
}: {
  isLoading: boolean;
  primarySharedVault: PrimarySharedVaultApi | undefined;
  settlement: PrimarySettlementSummary | null;
}): PrimarySharedVaultSettlementCardState {
  const primaryVaultName = primarySharedVault?.sharedVault?.name ?? "";
  const hasPrimaryVault = Boolean(primarySharedVault?.configured && primarySharedVault.sharedVault);

  if (!hasPrimaryVault) {
    return {
      amount: null,
      canSettle: false,
      hasPrimaryVault: false,
      primaryVaultName: "",
      subtitle: "No primary shared vault selected"
    };
  }

  if (isLoading || !settlement) {
    return {
      amount: null,
      canSettle: false,
      hasPrimaryVault: true,
      primaryVaultName,
      subtitle: "Loading primary shared vault settlements..."
    };
  }

  const canSettle = hasOutstandingSettlement(settlement);

  return {
    amount: settlement.amount,
    canSettle,
    hasPrimaryVault: true,
    primaryVaultName,
    subtitle: canSettle ? settlement.label : "All Settled"
  };
}

export function primarySharedVaultSafeToSpendSettlement({
  hasPrimaryVault,
  settlement
}: {
  hasPrimaryVault: boolean;
  settlement: Pick<SettlementApi, "payable" | "receivable"> | null;
}) {
  if (!hasPrimaryVault || !settlement) {
    return { youAreOwed: 0, youOwe: 0 };
  }

  return {
    youAreOwed: settlement.receivable,
    youOwe: settlement.payable
  };
}

export function applySafeToSpendRules(input: {
  availableCash: number;
  creditCardDue: number;
  remainingCommitments: number;
  savingsGoal: number;
  youAreOwed: number;
  youOwe: number;
}) {
  return Math.max(
    input.availableCash - input.youOwe + input.youAreOwed - input.remainingCommitments - input.creditCardDue - input.savingsGoal,
    0
  );
}

export function primarySharedVaultSafeToSpendBreakdownItems(input: {
  youAreOwed: number;
  youOwe: number;
}): SafeToSpendBreakdownItemApi[] {
  const items: SafeToSpendBreakdownItemApi[] = [
    { amount: input.youOwe, key: "you_owe", label: "You Owe", operation: "subtract" }
  ];

  if (input.youAreOwed > 0) {
    items.push({ amount: input.youAreOwed, key: "you_are_owed", label: "You Are Owed", operation: "add" });
  }

  return items;
}

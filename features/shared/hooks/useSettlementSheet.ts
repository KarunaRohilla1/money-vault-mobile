import { useState } from "react";

import {
  buildSettlementPayload,
  firstOutstandingSettlementItem,
  firstSettlementAccountId,
  settlementAccountError
} from "@/features/dashboard/settlement";
import type { SettlementSheetProps } from "@/features/shared/components/SettlementSheet";
import { useMarkSharedSettlementMutation, useSharedSettlementsQuery } from "@/features/shared/api";
import type { SharedSettlementItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useSettlementSheet({
  currencyCode,
  enabled,
  locale,
  sharedVaultId = null,
  token,
  vaultId
}: {
  currencyCode: CurrencyCode;
  enabled: boolean;
  locale: string;
  sharedVaultId?: number | null;
  token: string | null;
  vaultId: string | null;
}) {
  const settlementsQuery = useSharedSettlementsQuery(enabled ? token : null, vaultId, sharedVaultId);
  const markSettlement = useMarkSharedSettlementMutation(token, vaultId, sharedVaultId);
  const settlementItems = settlementsQuery.data?.data.items.filter((item) => item.amount > 0) ?? [];
  const [settlementVisible, setSettlementVisible] = useState(false);
  const [selectedSettlementIndex, setSelectedSettlementIndex] = useState(0);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementDate, setSettlementDate] = useState(todayIso());
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const selectedSettlementItem = settlementItems[selectedSettlementIndex] ?? firstOutstandingSettlementItem(settlementItems);

  function resetSettlementForm(item: SharedSettlementItemApi | null) {
    setSettlementAmount(item ? String(item.amount) : "");
    setSettlementDate(todayIso());
    setFromAccountId(item ? firstSettlementAccountId(item.from_accounts) : null);
    setToAccountId(item ? firstSettlementAccountId(item.to_accounts) : null);
    setSettlementError(item ? settlementAccountError(item) : null);
  }

  function selectSettlementItem(item: SharedSettlementItemApi) {
    const index = settlementItems.indexOf(item);
    setSelectedSettlementIndex(index >= 0 ? index : 0);
    resetSettlementForm(item);
  }

  function openSettlementSheet() {
    setSettlementVisible(true);
    void settlementsQuery.refetch().then((result) => {
      const items = result.data?.data.items.filter((item) => item.amount > 0) ?? [];
      const item = items[selectedSettlementIndex] ?? firstOutstandingSettlementItem(items);
      const nextIndex = item ? items.indexOf(item) : -1;
      setSelectedSettlementIndex(nextIndex >= 0 ? nextIndex : 0);
      resetSettlementForm(item);
    });
  }

  function closeSettlementSheet() {
    setSettlementVisible(false);
    setSettlementError(null);
  }

  async function submitSettlement() {
    try {
      if (selectedSettlementItem && Number(settlementAmount) > selectedSettlementItem.amount) {
        setSettlementError("Amount cannot exceed the outstanding settlement.");
        return;
      }

      const payload = buildSettlementPayload({
        amount: Number(settlementAmount),
        fromAccountId,
        item: selectedSettlementItem,
        settlementDate: settlementDate,
        toAccountId
      });

      await markSettlement.mutateAsync(payload);
      closeSettlementSheet();
    } catch (error) {
      setSettlementError(error instanceof Error ? error.message : "Unable to mark settlement.");
    }
  }

  const settlementSheetProps: SettlementSheetProps = {
    amount: settlementAmount,
    currencyCode,
    date: settlementDate,
    error: settlementError,
    fromAccountId,
    isLoading: settlementsQuery.isLoading,
    isSaving: markSettlement.isPending,
    items: settlementItems,
    locale,
    onAmountChange: (value) => {
      setSettlementAmount(value);
      setSettlementError(null);
    },
    onClose: closeSettlementSheet,
    onDateChange: (value) => {
      setSettlementDate(value);
      setSettlementError(null);
    },
    onFromAccountChange: (value) => {
      setFromAccountId(value);
      setSettlementError(null);
    },
    onItemChange: selectSettlementItem,
    onSubmit: () => void submitSettlement(),
    onToAccountChange: (value) => {
      setToAccountId(value);
      setSettlementError(null);
    },
    selectedItem: selectedSettlementItem,
    toAccountId,
    visible: settlementVisible
  };

  return {
    isSettling: markSettlement.isPending || settlementsQuery.isLoading,
    openSettlementSheet,
    settlementSheetProps
  };
}

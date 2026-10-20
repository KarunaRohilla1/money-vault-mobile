import { hasOutstandingSettlement } from "@/features/dashboard/settlement";
import type { SharedVaultBalanceCardApi } from "@/services/api/types";

export function visibleSharedVaultBalanceCards(cards: SharedVaultBalanceCardApi[] | undefined) {
  return (cards ?? []).filter(
    (card) => card.showOnDashboard !== false && hasOutstandingSettlement({ amount: card.amount, direction: card.direction })
  );
}

export function sharedVaultBalanceCarouselState({
  cards,
  isError,
  isLoading
}: {
  cards: SharedVaultBalanceCardApi[] | undefined;
  isError?: boolean;
  isLoading?: boolean;
}) {
  const visible = visibleSharedVaultBalanceCards(cards);

  if (isLoading) {
    return { kind: "loading" as const, cards: [] };
  }

  if (isError) {
    return { kind: "error" as const, cards: [] };
  }

  if (visible.length === 0) {
    if ((cards ?? []).length > 0) {
      return { kind: "hidden" as const, cards: [] };
    }
    return { kind: "empty" as const, cards: [] };
  }

  return { kind: "ready" as const, cards: visible };
}

export function sharedVaultBalanceCardCanSettle(card: SharedVaultBalanceCardApi) {
  return hasOutstandingSettlement({ amount: card.amount, direction: card.direction });
}

export function sharedVaultBalanceCardRoute(card: Pick<SharedVaultBalanceCardApi, "id">) {
  return {
    params: { sharedVaultId: String(card.id) },
    pathname: "/shared"
  };
}

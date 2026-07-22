import type {
  SettlementApi,
  SharedSettlementAccountApi,
  SharedSettlementItemApi,
  SharedSettlementPayloadApi
} from "@/services/api/types";

export const NO_SETTLEMENT_MESSAGE = "No outstanding settlement to mark.";
export const INVALID_SETTLEMENT_AMOUNT_MESSAGE = "Settlement amount must be greater than zero.";
export const INVALID_SETTLEMENT_ACCOUNT_MESSAGE = "Choose a valid active account for the settlement.";

export function hasOutstandingSettlement(settlement: Pick<SettlementApi, "amount" | "direction">) {
  return settlement.direction !== "settled" && settlement.amount > 0;
}

export function firstOutstandingSettlementItem(items: SharedSettlementItemApi[]) {
  return items.find((item) => item.amount > 0) ?? null;
}

export function firstSettlementAccountId(accounts: SharedSettlementAccountApi[]) {
  return accounts[0]?.id ?? null;
}

export function settlementAccountError(item: SharedSettlementItemApi) {
  if (item.from_accounts.length === 0) {
    return `${item.from_name} has no active account to pay from.`;
  }

  if (item.to_accounts.length === 0) {
    return `${item.to_name} has no active account to receive into.`;
  }

  return null;
}

export function settlementItemLabel(item: SharedSettlementItemApi, formattedAmount: string) {
  return `${item.from_name} pays ${item.to_name} ${formattedAmount} · ${item.shared_vault_name}`;
}

export function buildSettlementPayload(input: {
  amount: number;
  fromAccountId: number | null;
  item: SharedSettlementItemApi | null;
  settlementDate: string;
  toAccountId: number | null;
}): SharedSettlementPayloadApi {
  const { amount, fromAccountId, item, settlementDate, toAccountId } = input;

  if (!item) {
    throw new Error(NO_SETTLEMENT_MESSAGE);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(INVALID_SETTLEMENT_AMOUNT_MESSAGE);
  }

  if (!fromAccountId || !toAccountId) {
    throw new Error(INVALID_SETTLEMENT_ACCOUNT_MESSAGE);
  }

  return {
    amount,
    fromAccountId,
    fromVaultId: item.from_vault_id,
    settlementDate,
    sharedVaultId: item.shared_vault_id,
    toAccountId,
    toVaultId: item.to_vault_id
  };
}

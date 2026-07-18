# Money Vault Mobile Manual Acceptance Test

Run these against a fixture or copied database unless explicitly noted. Do not run destructive mutation scenarios against the real financial database.

## Environment

- Backend points to the intended test database.
- Mobile `.env` has only `EXPO_PUBLIC_API_BASE_URL`.
- No service-role key or Supabase credentials are present in the mobile app.
- FastAPI is running locally.
- Mobile development build includes Secure Store.

## P0 Authentication

1. Launch app signed out.
2. Enter a valid vault name and PIN.
3. Confirm login succeeds and token is saved.
4. Confirm no PIN, `pin_hash`, full JWT, or financial values are logged.
5. Force invalid PIN.
6. Confirm the app shows invalid credentials, not API unavailable.
7. Restart app.
8. Confirm session restores without requiring PIN.
9. Stop backend and restart app with saved token.
10. Confirm token is preserved and a retryable error is shown.
11. Return HTTP 401 for restore.
12. Confirm token is cleared and app returns to sign-in.

## P0 Vault Access

1. Log into an Individual vault.
2. Confirm personal navigation shows Dashboard, Accounts, Planning, Transactions/More access.
3. Open vault switcher.
4. Confirm one Personal Vault section and zero or more Shared Vaults.
5. Select a Shared vault.
6. Enter wrong PIN and confirm switch is rejected.
7. Enter correct PIN and confirm active vault changes.
8. Confirm shared navigation exposes only shared-supported workflows.
9. Return to personal vault.
10. Log out and confirm all vault state is cleared.

## P0 Dashboard Parity

For the same vault and fixture database, compare mobile/API with legacy Streamlit:

- Current financial cycle start/end/status.
- Safe to Spend.
- Primary account name and balance.
- Expenses this cycle.
- Remaining commitments.
- Credit-card due.
- Shared payable/receivable settlement.
- Needs Attention cards.
- Recent activity order and transfer exclusion.
- Spending by category totals.

Pass criteria: every value matches the legacy calculation for the same database rows.

## P0 Accounts

1. Create first account.
2. Confirm it becomes primary.
3. Create second account as non-primary.
4. Set second account primary and confirm first is unset.
5. Try duplicate account name with different casing.
6. Confirm behavior matches legacy validation.
7. Edit name/type/opening balance.
8. Confirm balance reflects opening balance and transactions.
9. Archive/delete primary account.
10. Confirm another active account becomes primary.

## P0 Transactions

1. Create Expense with valid account/category/date/amount/notes.
2. Confirm account balance decreases.
3. Create Income.
4. Confirm account balance increases.
5. Edit each field and confirm recalculated dashboard values.
6. Delete transaction and confirm linked planning statuses reset if applicable.
7. Confirm errors are visible for missing account/category/date/invalid amount.
8. Confirm transaction list filters match legacy:
   - Month
   - Last 3 months
   - This year
   - Custom date range
   - Account
   - Category
   - Search
   - Sort newest/oldest/amount high/amount low

## P0 Transfers

1. Create transfer between two different accounts.
2. Confirm one Transfer Out and one Transfer In row share a group id.
3. Confirm source balance decreases and destination balance increases.
4. Confirm transfer is excluded from recent activity and spending where legacy excludes it.
5. Edit transfer and confirm both paired rows update.
6. Delete transfer and confirm both paired rows are removed.
7. Try same source/destination and confirm validation error.

## P0 Shared Expenses

1. Create shared expense from personal vault to connected shared vault.
2. Test Equal allocation.
3. Test Percentage allocation totaling exactly 100%.
4. Test Fixed Amount allocation totaling transaction amount.
5. Confirm invalid totals are rejected.
6. Confirm custom categories cannot be used for shared transactions if legacy rejects them.
7. Confirm participant shares are stored and dashboard settlement updates.
8. Edit shared expense and confirm shares are replaced correctly.
9. Delete shared expense and confirm settlement/dashboard values reverse.

## P0 Settlements

1. Load outstanding shared settlements.
2. Select payer and receiver accounts exactly as legacy allows.
3. Enter valid partial/full amount and date.
4. Mark settled.
5. Confirm settlement transactions are created.
6. Confirm payer/receiver balances and dashboard settlement change.
7. Try invalid amount greater than owed and confirm it is blocked.

## P0 Planning

1. Add income template.
2. Add commitment.
3. Mark income received with actual amount.
4. Confirm linked income transaction behavior matches legacy.
5. Mark commitment paid.
6. Confirm linked expense transaction behavior matches legacy.
7. Cancel income/commitment.
8. Carry forward commitment.
9. Close active cycle.
10. Confirm rollover and current cycle match legacy.

## P1 Categories

1. Add custom category.
2. Edit custom category.
3. Try editing/deleting system category and confirm legacy behavior.
4. Delete category with transactions.
5. Confirm fallback/move behavior matches legacy.

## P1 Shared Bills

1. Create shared bill.
2. Confirm current shared bill cycle generates instance.
3. Mark bill paid.
4. Confirm payer, shares, transaction, and remaining summary update.
5. Skip instance.
6. Cancel bill.
7. Duplicate bill.
8. Close shared bill cycle.

## P1 Wishlist

1. Add wishlist category.
2. Add item with estimated cost, saved amount, account, target date, image URL, notes.
3. Confirm progress and summary.
4. Edit item.
5. Delete item.
6. Delete category and confirm fallback behavior.

## P1 Reports

Compare each report against legacy for:

- Date range.
- Cycle filters.
- Vault filters.
- Account filters.
- Category filters.
- Income/expense/transfer inclusion.
- Shared amounts.
- Totals and chart groupings.

## P1 Settings

1. Rename vault.
2. Update monthly cycle start day 1-31.
3. Update monthly savings goal.
4. Change PIN if supported by legacy workflow.
5. Verify admin-only controls.
6. Verify shared vault links.

## Validation Commands

Backend:

```powershell
python -m pytest tests/api -q
python tests/smoke_import_boundaries.py
python tests/smoke_postgres_wrapper.py
python tests/smoke_reports_calculations.py
python tests/smoke_money_flow.py
python -m compileall api db tests
```

Mobile:

```powershell
npm run typecheck
npm run lint
npm test
npm run validate
```


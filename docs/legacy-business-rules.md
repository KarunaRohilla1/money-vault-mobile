# Legacy Money Vault Business Rules

This document records behavior traced from `C:\Users\User\OneDrive\Documents\Projects\money-vault`. It is not a redesign proposal.

## Architecture Boundary

- The legacy Streamlit app is the behavioral source of truth.
- The mobile app should call the FastAPI backend.
- Financial calculations, database mutations, authorization/resource checks, and shared-expense rules belong in Python/backend code.
- The mobile app should handle presentation, forms, local session state, navigation, and client-side validation that mirrors backend constraints.

## Navigation

Legacy entry point: `app.py`.

- Individual vault menu: Dashboard, Accounts, Planning, Transactions, Transfers, Reports, Categories, Wishlist, Settings.
- Shared vault menu: Dashboard, Shared Expenses, Bills.
- Shared vaults expose Settings through a separate sidebar button.
- Switching from a personal vault to a shared vault requires selecting a connected shared vault and entering that shared vault PIN.
- Switching back from a shared vault returns to the original personal vault without re-entering the personal PIN.
- Shared-vault feature screens are deferred in the mobile parity plan until Individual vault workflows are complete. Shared activation and visibility may exist, but Shared Dashboard, Shared Expenses, and Bills are not considered accepted.

## Authentication

Sources: `app.py`, `db.core.hash_pin`, `db.vaults.verify_pin`, `api.auth`.

- Login accepts exact vault name and plaintext PIN.
- PIN is hashed with SHA-256 by `db.core.hash_pin(pin)`.
- The vault is verified by matching name and computed `pin_hash`.
- No Supabase Auth user identity is involved in current legacy behavior.
- Legacy session state stores `vault_id`, `vault_name`, `is_admin`, active vault, and original personal vault fields.
- Logout clears authentication and active/shared vault session fields and clears data cache.

## Database Model

Schema source: `supabase/schema.sql`.

- `vaults` stores vault name, `pin_hash`, admin flag, cycle settings, savings goal, and `vault_type`.
- `vault_type` is generally `Individual` or `Shared`.
- `vault_shares` links Individual participant vaults to Shared vaults.
- `accounts`, `categories`, `transactions`, `income_templates`, `commitments`, `wishlist_items`, and `wishlist_categories` are vault-scoped.
- `transactions.beneficiary_vault_id` identifies whether a transaction is personal or targets a shared vault.
- `transaction_shares` stores participant shares for shared expenses.
- Shared bills use `shared_bills`, `shared_bill_cycles`, `shared_bill_instances`, and `shared_bill_instance_shares`.

## Account Rules

Sources: `views.accounts`, `db.accounts`.

- Account types are defined by legacy constants: Salary Account, Savings Account, Credit Card, Cash, and Other.
- Account name is required.
- Opening balance is required.
- Legacy Streamlit does not explicitly reject a zero opening balance. Money Vault Mobile now rejects zero opening balances as an approved product deviation for onboarding, account creation, and account editing.
- Opening balance cannot be negative unless the account type is Credit Card.
- Editing a legacy account that already has zero opening balance is still allowed to view, but saving the account through the mobile/API form requires changing opening balance to a non-zero value.
- Duplicate active account names are rejected case-insensitively within the same vault.
- The first active account in a vault becomes primary automatically.
- Setting an account primary clears primary from other active accounts in that vault.
- Active account ordering is primary first, then type, then name.
- Account balance is opening balance plus Income and Transfer In, minus Expense and Transfer Out.
- Credit-card due is the absolute value of negative balances on Credit Card accounts.
- Deleting an account archives it (`is_active = 0`) and removes primary status; if the archived account was primary, the legacy backend promotes the active account with the smallest id.
- Legacy warns before archiving an account with transaction history: "This account has financial history. It will be marked inactive and kept in reports and existing transactions." It still archives rather than physically deleting the row.

## Transaction Rules

Sources: `components.transaction_form`, `views.transactions`, `db.transactions`, `db.transaction_shares`.

- Ordinary transaction types are Income and Expense.
- Transfer rows use Transfer Out and Transfer In and are paired by `transfer_group_id`.
- Recent activity excludes zero-amount transactions and Transfer In/Transfer Out.
- Transaction filters include month, last 3 months, this year, custom date range, category, account, search, and sort order.
- Shared transactions require the shared-expense schema, a beneficiary shared vault, participant vaults, and a valid allocation method.
- Shared allocations support Equal, Percentage, and Fixed Amount.
- Percentage allocations must total exactly 100%.
- Fixed allocations must total the transaction amount.
- Shared transactions involving a shared vault can only use system categories.
- Deleting a transfer transaction deletes both paired rows by `transfer_group_id`.
- Deleting a non-transfer transaction resets linked income/obligation status rows to PENDING and clears linked transaction IDs.

## Transfer Rules

Sources: `views.transfers`, `db.transfers`, `api.transfers`.

- Transfers are not ordinary income/expense entries for reporting/activity where legacy excludes Transfer In/Transfer Out.
- A transfer creates two transaction rows:
  - Transfer Out from the source account.
  - Transfer In to the destination account.
- Both rows share the same generated `transfer_group_id`.
- The legacy helper generates the group id with `uuid.uuid4()`.
- Required fields are source account, destination account, transfer date, and amount.
- Notes are optional, trimmed by the Streamlit form, and duplicated onto both paired rows.
- The transfer date is stored as an ISO date string.
- Amount must be greater than zero; zero, blank, and negative amounts are rejected.
- Source and destination accounts must be different.
- The legacy create form selects from active accounts returned by `get_accounts(vault_id)`.
- Editing is allowed only when both selected account ids still appear in the active account list; transfers using archived or missing accounts cannot be edited in the legacy UI.
- The list endpoint returns one logical row per transfer group by joining the Transfer Out row to the Transfer In row.
- Transfer list ordering is newest transfer date first, then newest source transaction id.
- Optional list filters are date range and account; the account filter matches either source or destination account.
- Mobile transfer filtering uses the backend-supported date range and account-involved filters.
- The main mobile Transfers page shows a recent subset of five logical transfers; View All expands the same screen to the full filtered history.
- Editing a transfer updates both paired rows.
- Deleting a transfer deletes both paired rows.
- If one pair row is missing, legacy `get_transfer_by_group`/`get_transfers` does not return a logical transfer because the join fails.
- Credit Card payments are ordinary transfers into a Credit Card account: bank/cash source is Transfer Out, Credit Card destination is Transfer In.
- Transfers clear cached transfer, transaction, account, dashboard, and report data after create/update/delete.

## Dashboard Rules

Sources: `views.dashboard`, `db.dashboard`, `db.shared_expenses`, `db.shared_bills`.

- Dashboard uses the active financial cycle from `db.financial_cycles.get_current_cycle`.
- Primary account balance comes from transaction-adjusted active account balances.
- Expenses this cycle use shared-expense aware spending from `get_personal_spend_summary`.
- Remaining commitments come from current-cycle planning totals.
- Credit-card due is total negative Credit Card account balance.
- Shared settlement summary comes from `get_settlement_summary`.
- Safe to Spend is:

```text
max(
  available_cash
  - settlement_summary["payable"]
  - remaining_commitments
  - credit_card_due
  - monthly_savings_goal,
  0
)
```

- `available_cash` currently means positive balance in Salary Account type within dashboard SQL.
- Recent activity is newest first, limit five, excluding transfers and zero amounts.
- Category spending comes from `get_actual_category_spending`, which includes shared-expense adjustments.

## Planning Rules

Sources: `views.planning`, `db.planning`, `db.financial_cycles`.

- Planning consists of income templates and commitments.
- Templates/commitments have name, amount, due day, and account.
- Due day is 1-31 in current backend validation.
- Income statuses include PENDING, RECEIVED, CANCELLED.
- Commitment statuses include PENDING, PAID, CANCELLED, CARRIED_FORWARD.
- Status changes may create/update linked transactions through planning helpers.
- Closing a cycle carries forward or finalizes planning state according to `db.planning.finalize_month` and `db.financial_cycles.close_active_cycle`.

## Financial Cycle Rules

Sources: `db.financial_cycles`, `db.dashboard`, `db.planning`.

- Vault cycle start day comes from `financial_cycle_start_day`, falling back to `month_start_day`, then 1.
- Month-end dates clamp when a chosen day does not exist in a month.
- Dashboard setup considers a cycle setting valid when the day is between 1 and 31.
- Current cycle drives dashboard, planning totals, shared bills, and reports.

## Shared Expense And Settlement Rules

Sources: `views.shared_expenses`, `views.dashboard.mark_settlement_dialog`, `db.shared_expenses`, `db.transaction_shares`.

- Shared vault access comes from `vault_shares`.
- Participants are Individual vaults linked to a Shared vault.
- Shared spending tracks who paid and who owes by transaction shares.
- Settlement balance can be payable or receivable from the current personal vault perspective.
- Marking a settlement requires participant account selection and creates settlement transfer records through `settle_outstanding_settlement`.
- The mobile app may expose participant account selection because the legacy app does.

## Shared Bill Rules

Sources: `views.shared_auxiliary`, `db.shared_bills`, `api.shared`.

- Shared bills belong to a Shared vault.
- Bills have amount, due day, frequency, category, active state, notes, start/end dates.
- Current bill cycles are generated for shared vaults.
- Instances can be skipped or marked paid.
- Marking paid records payer vault, payment date, optional notes, and linked transaction behavior.
- Bills can be cancelled, duplicated, and cycles can be closed.

## Reports

Sources: `views.reports`, `api.reports`, report smoke tests.

- Reports must use backend calculations, not mobile-side recomputation.
- Filters and grouping must match legacy date range, cycle, account, category, transfer exclusion/inclusion, shared spending, and totals.

## Settings

Sources: `views.settings`, `db.vaults`, `api.settings`.

- Settings include vault name, PIN, cycle start day, monthly savings goal, vault type, shared-vault links, admin operations, and accessible vaults.
- Admin state comes from the authenticated vault row.
- Mobile currently only has partial settings/accessibility through More and onboarding.

## Error Handling

- Failed financial queries must surface errors.
- Mobile must not silently show zero when an API call fails.
- Backend should return safe JSON errors through `api.main`, never SQL internals or stack traces.

## Data Safety

- The active database contains real financial data.
- Destructive tests and mutation parity tests require fixtures or a copied test database.
- Do not run broad migrations, table resets, or destructive cleanup against the real database.

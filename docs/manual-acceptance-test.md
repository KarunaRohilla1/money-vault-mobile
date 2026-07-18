# Money Vault Mobile Manual Acceptance Test

Run these against a fixture or copied database unless explicitly noted. Do not run destructive write scenarios against the real financial database.

## Environment

- Backend points to the intended test database.
- Mobile `.env` has only `EXPO_PUBLIC_API_BASE_URL`.
- No service-role key or Supabase credentials are present in the mobile app.
- FastAPI is running locally.
- Mobile development build includes Secure Store.

## P0 Authentication

Manual result: PASS.

Completed checks:

1. Launch app signed out.
2. Enter a valid personal vault name and PIN.
3. Confirm login succeeds.
4. Confirm active vault name and type are correct.
5. Close and reopen the application.
6. Confirm the app restores without entering the PIN again.
7. Enter an invalid PIN.
8. Confirm the app shows an invalid-credentials message, not an unavailable-backend message.
9. Log out.
10. Relaunch and confirm the app remains signed out.

Automated resilience coverage:

- Temporary backend-unavailable restore preserves the saved session and shows retry.
- Invalid or expired saved session returns to sign-in.
- Sensitive values are not printed in app or backend logs.

## P0 Vault Access

Manual result: PARTIAL.

Completed checks:

1. Connected Shared vaults are listed correctly.
2. Incorrect Shared PIN is rejected.
3. Active vault remains unchanged after an incorrect Shared PIN.
4. Correct Shared PIN activates the Shared vault.
5. Returning to the original Personal vault does not ask for the Personal vault PIN again.
6. Personal navigation is restored after returning to the Personal vault.
7. Logout clears personal and shared vault context.

Deferred checks:

- Shared Dashboard, Shared Expenses, and Bills screens are not accepted yet.
- Shared feature development resumes only after Individual vault parity is complete.

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

Use a fixture or copied database.

1. Open Accounts for a Personal vault.
2. Confirm a loading state appears while accounts load.
3. Confirm active accounts appear only for the current Personal vault.
4. Confirm the primary account appears first, followed by the same type/name ordering as the legacy app.
5. Create the first account in an empty vault and confirm it becomes primary.
6. Confirm the type selector lists Salary Account, Savings Account, Credit Card, Cash, and Other.
7. Create one account for each type.
8. Try to create an account without choosing a type and confirm a clear validation message appears only after submitting.
9. Create a second account without marking it primary and confirm the first account stays primary.
10. Mark the second account primary and confirm the first account is no longer primary.
11. Try to save an account with a blank name and confirm a clear validation message.
12. Try to save an account with a blank opening balance and confirm a clear validation message.
13. Try to save a duplicate account name using different letter casing and confirm it is rejected.
14. Try a negative opening balance for a non-credit-card account and confirm it is rejected.
15. Try a negative opening balance for a Credit Card account and confirm it is accepted.
16. Try blank, zero, `0.00`, and `-0` opening balances and confirm each is rejected.
17. Edit an account name, type, and opening balance; confirm the Edit Account form is visually distinct from Add Account.
18. Confirm balances match the legacy app after Income, Expense, Transfer In, and Transfer Out entries.
19. Archive a non-primary account, cancel once, then confirm once.
20. Archive a primary account and confirm another active account becomes primary.
21. Archive an account with transactions and confirm the mobile warning matches legacy: it is marked inactive and kept in reports and existing transactions.
22. Pull to refresh and confirm the list remains accurate.
23. Temporarily make the backend unavailable during first load and confirm the screen shows a retry error.
24. Temporarily make the backend unavailable after accounts have loaded and confirm cached accounts remain visible with "Could not refresh accounts. Showing previously loaded data."
25. Review the Accounts screen and Add Account form visually against `docs/mockups/Accounts.png` and `docs/mockups/Add_Account.png`.

Current manual status: failed before fixes; retest required. UI acceptance remains FAIL until Android screenshots are compared against the mockups. Do not mark Accounts as passed until every step above succeeds.

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

Current manual status: RETEST REQUIRED.

Use a fixture or copied database. Do not run destructive write scenarios against the real financial database.

1. Open Transfers in a Personal vault.
2. Confirm loading state.
3. Confirm only current-vault transfers appear.
4. Confirm each transfer appears once, not once per paired row.
5. Confirm ordering matches legacy: newest transfer date first, then newest source transaction id.
6. Create a transfer between two different active accounts.
7. Confirm one Transfer Out and one Transfer In row share the same group id.
8. Confirm source balance decreases by the transfer amount.
9. Confirm destination balance increases by the transfer amount.
10. Confirm Accounts page updates after returning without restarting the app.
11. Confirm Dashboard values refresh where affected.
12. Confirm transfer is absent from Recent Activity.
13. Confirm transfer is excluded from expense/category totals where legacy excludes it.
14. Try using the same source and destination and confirm a validation error.
15. Try a blank amount.
16. Try zero.
17. Try a negative amount.
18. Try an invalid date.
19. Try submitting twice rapidly and confirm only one transfer group is created.
20. Edit amount and confirm both rows and balances update.
21. Edit source account and confirm old/new source balances update.
22. Edit destination account and confirm old/new destination balances update.
23. Edit date and notes.
24. Confirm edit preserves the transfer group id.
25. Cancel edit and confirm no mutation occurs.
26. Delete a transfer and cancel once.
27. Delete again and confirm once.
28. Confirm both paired rows are removed.
29. Confirm both balances revert.
30. Make the backend unavailable on initial load and confirm a retry error.
31. Make the backend unavailable after data has loaded and confirm cached data remains visible with a refresh warning.
32. Log into another Personal vault and confirm no previous-vault transfer briefly appears.
33. Attempt direct API access to another vault's transfer and confirm rejection.
34. Transfer from a bank/cash account into a Credit Card.
35. Confirm Credit Card balance and due update exactly as legacy.
36. Confirm the transfer did not create Income or Expense rows.
37. Visually compare the screen with `docs/mockups/Transfers.png`.
38. Test on a smaller Android screen with the keyboard open.
39. Confirm Shared-vault navigation does not expose the Personal Transfers page.
40. Confirm the Filter button opens the filter sheet.
41. Confirm Apply filter updates the history list.
42. Confirm Clear filter restores unfiltered history.
43. Confirm Cancel closes the sheet without applying draft filter changes.
44. Confirm an active filter indicator is visible.
45. Confirm View All expands to full transfer history.
46. Confirm Android back returns from full history to the main Transfers form.
47. Confirm newly saved transfers appear in recent/full history without manual refresh.
48. Confirm edited transfers update in recent/full history without manual refresh.
49. Confirm deleted transfers disappear from recent/full/filtered history without manual refresh.
50. Confirm disabled Review Transfer text remains readable.
51. Confirm spacing and typography match the approved screenshot closely enough for device acceptance.

## P0 Transfers Manual Execution

Environment:
- Device:
- Android version:
- Mobile commit:
- Backend commit:
- Fixture/copied database:
- Personal vault:
- Test date:
- Tester:

| ID | Test | Result | Evidence | Notes |
|---|---|---|---|---|
| TRF-01 | Transfer list loads | PASS/FAIL | | |
| TRF-02 | One logical row per transfer | PASS/FAIL | | |
| TRF-03 | Create paired rows | PASS/FAIL | | |
| TRF-04 | Source/destination balances | PASS/FAIL | | |
| TRF-05 | Same-account validation | PASS/FAIL | | |
| TRF-06 | Edit both paired rows | PASS/FAIL | | |
| TRF-07 | Delete both paired rows | PASS/FAIL | | |
| TRF-08 | Transfer excluded from spending/activity | PASS/FAIL | | |
| TRF-09 | Credit Card payment | PASS/FAIL | | |
| TRF-10 | Cross-vault protection | PASS/FAIL | | |
| TRF-11 | Cached-data refresh failure | PASS/FAIL | | |
| TRF-12 | Mockup visual acceptance | PASS/FAIL | | |

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

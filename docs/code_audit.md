# Money Vault Mobile Code Audit

Date: 2026-07-30
Scope: React Native / Expo mobile repository at `C:\Projects\money-vault-mobile`.

This audit is intentionally conservative. The application is in active development and the worktree already contains uncommitted feature changes, so no source file was deleted during this pass.

## Executive Summary

The codebase is generally healthy for a production-bound Expo application:

- TypeScript strict mode is enabled.
- `npm run typecheck` passes.
- ESLint passes after excluding generated/cache directories.
- No `console.*`, `debugger`, TODO, FIXME, HACK, `@ts-ignore`, or `@ts-expect-error` markers were found in tracked source using repository-wide search.
- API access is centralized through `services/api` and environment configuration is centralized through `lib/env.ts`.
- Authentication/session state is centralized through providers and Zustand stores.

The main maintainability risk is accumulated legacy/candidate-dead code around earlier Reports implementations and duplicated feature entry points. These should not be removed without owner review because Reports and Wishlist are actively changing.

## Current Worktree Context

The worktree was dirty before this audit. Existing modified/untracked files include Reports, Wishlist, Settings logout, and onboarding store changes. This audit did not attempt to reset or remove those changes.

## Search Results

### Debugging and Temporary Code

No tracked source hits found for:

- `console.`
- `debugger`
- `TODO`
- `FIXME`
- `HACK`
- `XXX`
- `@ts-ignore`
- `@ts-expect-error`
- obvious temporary/debug markers

### Commented-out Code

No repository-wide commented-out code blocks were identified in tracked source by the audit search. Existing short explanatory comments appear intentional, for example React Hook Form watch/effect notes in Wishlist code.

### Generated and Cache Directories

Local generated/cache directories exist but are ignored by Git:

- `.expo/`
- `.npm-cache/`
- `node_modules/`

ESLint was previously scanning `.expo/types/router.d.ts` and reporting a generated-file warning. `eslint.config.js` now explicitly ignores generated/cache/build folders.

## Candidate Unused or Legacy Files

These files appear to be legacy or candidate-unused based on import/reference searches. They were not deleted because the Reports feature is still evolving and some may be intentionally retained for pending tabs or future parity work.

### Reports legacy/presentation candidates

The active Reports screen currently routes the Spending tab through:

- `features/reports/tabs/SpendingTab.tsx`
- `features/reports/analytics/*`
- `features/reports/components/spending/*`

The following older Reports components/models appear to have no active imports outside their own definitions or legacy tests:

- `features/reports/adapter.ts`
- `features/reports/state.ts`
- `features/reports/components/SpendingSummary.tsx`
- `features/reports/components/SpendingBreakdown.tsx`
- `features/reports/components/SpendingTrendChart.tsx`
- `features/reports/components/MerchantRanking.tsx`
- `features/reports/components/FilterSheet.tsx`
- `features/reports/components/ReportHero.tsx`
- `features/reports/components/ReportDetailsAccordion.tsx`
- `features/reports/components/ReportCategoryBreakdown.tsx`
- `features/reports/components/ReportPeriodSelector.tsx`
- `features/reports/analytics/components/SummarySection.tsx`
- `features/reports/analytics/components/DimensionSelector.tsx`
- `features/reports/analytics/components/FilterSheet.tsx`

Recommendation: perform a dedicated Reports cleanup only after Reports tabs and acceptance criteria are finalized.

### Wishlist duplicate entry point candidate

There are two Wishlist screen paths:

- `features/wishlist/WishlistScreen.tsx`
- `features/wishlist/screens/WishlistScreen.tsx`

The route appears to use the `screens/` version. The top-level file should be reviewed after current Wishlist changes settle.

### Foundation component usage candidates

Some foundation components may be unused or lightly used depending on current imports:

- `components/cards/MoneyCard.tsx`
- `components/cards/StatCard.tsx`
- `components/charts/ChartShell.tsx`
- `components/forms/FormField.tsx`
- `components/layout/ScreenHeader.tsx`
- `components/layout/Section.tsx`

These are foundation components and should not be deleted solely because they are not currently referenced by every feature.

## Duplicate Code Observations

### Reports summary/card presentation

Reports has both older components and newer `components/spending/*` components. This creates duplicated presentation concepts for:

- Summary cards
- Filter sheets
- Dimension selectors
- Breakdown/chart sections

Risk: future fixes may land in only one path. This already happened with the Reports Spending selector label and summary captions.

Recommendation: after Reports acceptance, keep only the active presentation path and remove older unused components in a dedicated cleanup PR.

### API modules and type modules

The API layer is organized consistently, but there are many feature-specific `*.types.ts` modules plus a broad `services/api/types.ts` barrel. This is maintainable as long as the barrel remains a compatibility surface and feature modules own detailed contracts.

## Safe Cleanup Performed

- Added generated/cache/build ignores to `eslint.config.js` so ESLint does not scan `.expo`, `.npm-cache`, `node_modules`, `dist`, `web-build`, or `android`.

No business logic, UI, route, schema, or feature behavior was changed.

## Not Cleaned Up

No files were deleted in this pass.

No candidate legacy components were removed because they may still be needed for in-flight Reports/Wishlist work.

## Risks

- `docs/` is ignored by `.gitignore`, while several existing docs are already tracked. New docs created under `docs/` may require explicit `git add -f` if they should be committed.
- Reports contains legacy and active presentation paths with overlapping names and responsibilities.
- The worktree contains unrelated in-progress changes, so broad automatic cleanup would be risky.
- Expo SDK package versions should be checked with `npx expo install --check` before production builds.

## Recommendations

1. Complete/accept Reports and Wishlist feature work before deleting candidate legacy files.
2. Add a dedicated unused-export tool such as `ts-prune` or `knip` in a future tooling-only PR.
3. Decide whether `docs/` should remain ignored. If documentation is source-controlled, remove `docs/` from `.gitignore` or use a narrower ignore for generated docs/assets.
4. Keep lint/typecheck/test as the deployment gate.
5. Add CI cache cleanup for `.expo`/Metro artifacts if build machines reuse workspaces.
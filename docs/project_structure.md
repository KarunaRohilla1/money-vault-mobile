# Money Vault Mobile Project Structure

Date: 2026-07-30

## Overview

Money Vault Mobile is an Expo Router React Native application. The mobile app talks to the Money Vault backend API and does not query Supabase financial tables directly.

Primary runtime flow:

1. Expo Router loads `app/_layout.tsx`.
2. `AppProviders` installs gesture handling, global error boundary, React Query, authentication restoration, and bootstrap/access state.
3. `AccessGate` routes users between authenticated and signed-out flows.
4. Feature screens use API services through React Query hooks.
5. API services call the backend API using the centralized request client.

## Entry Points

- `app/_layout.tsx` - root Expo Router layout. Imports global CSS, Reanimated, providers, status bar, and root stacks.
- `app/(auth)/` - signed-out/authentication route group.
- `app/(app)/` - authenticated application route group.
- `app/(app)/(tabs)/_layout.tsx` - bottom-tab shell and global FAB configuration.
- `providers/AppProviders.tsx` - top-level provider composition.

## Major Folders

### `app/`

Expo Router route definitions. Route files should stay thin and delegate behavior to feature modules.

Key groups:

- `app/(auth)/sign-in.tsx` - login route.
- `app/(auth)/pin-unlock.tsx` - PIN unlock placeholder/route.
- `app/(app)/(tabs)/` - Dashboard, Accounts, Planning, More, FAB tab route group.
- `app/(app)/transaction/` - transaction create/edit/detail routes.
- `app/(app)/transfers/` - transfer routes.
- `app/(app)/reports/` - reports route.
- `app/(app)/wishlist/` - wishlist route.
- `app/(app)/settings/[section].tsx` - settings placeholder/detail route.

### `components/`

Reusable, feature-agnostic UI and layout building blocks.

- `components/ui/` - buttons, sheets, loading/error/empty states, avatar, currency text, FAB, tags.
- `components/layout/` - screen wrappers and layout helpers.
- `components/cards/` - reusable card primitives.
- `components/charts/` - shared chart shell primitives.
- `components/forms/` - shared form-field primitives.

### `features/`

Feature-owned screens, hooks, adapters, local models, and feature components.

Major modules:

- `features/dashboard/` - Dashboard presentation, adapters, Safe to Spend explanation, recent activity presentation.
- `features/accounts/` - Accounts screen, account API hook, account modeling, account-type selector.
- `features/transactions/` - transaction history, detail, form, filters, CSV/export model, icons.
- `features/transfers/` - transfer flow, transfer history, transfer model/API hooks.
- `features/planning/` - planning screen, financial activities, cycle picker, close-cycle UI, recurring planning.
- `features/reports/` - reports overview, spending analytics tab, report adapters/models/components.
- `features/categories/` - category management screen and category presentation model.
- `features/wishlist/` - wishlist screen, cards, sheets, validation, utils, API hooks.
- `features/settings/` - More screen, settings row model, logout navigation helper.
- `features/onboarding/` - onboarding screen, steps, schema, options, flow hook.
- `features/shared/` - shared-vault screen and API hook.

### `services/api/`

Backend API contracts and request functions.

- `services/api/core/request.ts` - centralized HTTP client, timeout, JSON parsing, error normalization, bearer token support, confirmed 401 handling.
- `services/api/client.ts` - API barrel and `apiClient` composition.
- Feature modules such as `accounts.ts`, `dashboard.ts`, `reports.ts`, etc. expose typed request functions.
- `*.types.ts` files define API response/request contracts.
- `tokenStorage.ts` owns Secure Store token access.
- `session.ts` owns login/session restoration/shared-vault activation helpers.
- `logout.ts` owns centralized logout cleanup.

### `providers/`

Application-wide runtime providers.

- `AuthProvider.tsx` - restores backend session and handles unauthorized cleanup.
- `AppBootstrapProvider.tsx` - derives app access state from auth/setup state.
- `AccessGate.tsx` - navigation guard based on access state.
- `GlobalErrorBoundary.tsx` - global runtime error fallback.
- `query/ReactNativeQueryProvider.tsx` - React Query setup with AppState and NetInfo integration.

### `stores/`

Zustand client state.

- `authStore.ts` - backend JWT and current/authenticated vault metadata in memory.
- `accessStore.ts` - bootstrap/access state.
- `settingsStore.ts` - persisted app/device preferences such as currency/locale/biometric setting.
- `onboardingStore.ts` - persisted vault-scoped onboarding progress.
- `zustandStorage.ts` - AsyncStorage bridge for Zustand persistence.

### `lib/`

Shared utilities and app-level helpers.

- `env.ts` - environment parsing and validation.
- `queryClient.ts` / `queryKeys.ts` - React Query client and key factories.
- `format.ts`, `date.ts` - formatting helpers.
- `accessRoutes.ts`, `appShell.ts`, `bottomTabMetrics.ts`, `vaultNavigation.ts` - navigation/layout helpers.

### `theme/`

Design tokens and theme exports.

- `tokens.ts` - colors, typography, spacing, radii, shadows, elevation, icons, animation tokens.
- `index.ts` - theme barrel.

### `constants/`

Shared constants such as navigation icon names.

### `types/`

Cross-cutting TypeScript domain and asset types.

### `__tests__/`

Jest unit and presentation-model tests. Current coverage focuses on adapters, API client behavior, auth/session restoration, state models, feature presentation models, and selected component structures.

### `docs/`

Project documentation and acceptance/mockup artifacts. Note: `docs/` is currently ignored by `.gitignore`, even though several docs are already tracked.

## Data Flow

### Authentication/session flow

1. Login screen submits vault name and PIN to backend API.
2. Backend returns JWT and safe vault metadata.
3. Mobile stores only the backend JWT in Expo Secure Store.
4. Auth state stores token and vault metadata in memory.
5. On app launch, `AuthProvider` reads Secure Store and validates the session with the backend.
6. Confirmed 401 clears token/session; temporary network failures preserve the token.

### Feature data flow

1. Screen or feature hook reads token/vault ID from `authStore`.
2. React Query hook calls a typed `services/api/*` function.
3. `request()` builds the backend URL from `EXPO_PUBLIC_API_BASE_URL`, attaches bearer auth, parses JSON, and normalizes errors.
4. Feature adapters/presentation models transform API data for rendering.
5. Screens render loading, error, empty, or success states.

### Logout flow

1. More screen displays Logout as the final destructive preference row.
2. Confirmation sheet asks for explicit confirmation.
3. Centralized logout clears Secure Store token first.
4. On successful token deletion, React Query cache, auth state, access state, and vault-scoped onboarding state are cleared.
5. Navigation stack is reset to `/sign-in`.
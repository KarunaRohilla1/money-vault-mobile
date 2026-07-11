# Money Vault 2.0 Mobile

Production React Native foundation for Money Vault 2.0. This repository currently contains application infrastructure only, not Dashboard, Accounts, Transactions, or other business features.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in the existing Supabase project URL and anon key.
4. Start Expo with `npm start`.

## Environment Variables

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env` or secrets. Supabase session persistence is handled by Supabase Auth using Expo Secure Store.

## Architecture

- `app/(auth)` contains unauthenticated and vault-lock routes such as sign-in and PIN unlock.
- `app/(app)` contains authenticated app routes, vault selection, transaction route placeholders, and nested tabs.
- `app/(app)/(tabs)` contains the authenticated bottom navigation shell.
- `providers/` composes auth, bootstrap/access state, React Query, native connectivity integration, and global error handling.
- `stores/` contains small Zustand stores. Only safe local primitives are persisted.
- `services/supabase/` contains the typed Supabase client.
- `theme/` contains typed design tokens consumed by app code and NativeWind/Tailwind.
- `components/` contains reusable UI, layout, card, chart, and form primitives.
- `features/` contains feature-owned placeholder surfaces only.

## Auth Versus Vault Unlock

Supabase authentication answers who the user is. Vault PIN unlock answers whether the selected local vault can be opened on this device.

The centralized app access state is:

- `booting`
- `signed-out`
- `selecting-vault`
- `vault-locked`
- `ready`

Supabase session objects are kept in memory by `authStore` and persisted only through Supabase Auth storage. The app separately persists safe local values:

- `currentVaultId`
- `currencyCode`
- `locale`
- `biometricUnlockEnabled`

Defaults are `INR` and `en-IN` until vault settings override them in a future feature sprint.

## Commands

- `npm start`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run validate`

## Folder Structure

```text
app/
  (auth)/
  (app)/
    (tabs)/
    transaction/
components/
  ui/
  cards/
  charts/
  forms/
  layout/
features/
  dashboard/
  accounts/
  transactions/
  planning/
  reports/
  settings/
providers/
services/
stores/
hooks/
lib/
constants/
theme/
types/
assets/
```

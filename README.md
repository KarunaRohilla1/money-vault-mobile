# Money Vault 2.0 Mobile

Production React Native foundation for Money Vault 2.0. The mobile app is an API client only:

```text
React Native mobile app -> FastAPI backend -> Supabase/PostgreSQL
```

The mobile app must not query Supabase financial tables directly and must never contain a Supabase service-role key.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set the backend API URL. Use `http://10.0.2.2:<port>` for the Android emulator. A physical device must use your computer's LAN IP address, for example `http://192.168.x.x:<port>`.
4. Start Expo with `npm start`.

## Environment Variables

```text
EXPO_PUBLIC_API_BASE_URL=
```

Do not commit `.env` or secrets. This value points to the Money Vault backend API, not Supabase.

## Architecture

- `app/(auth)` contains backend vault login routes.
- `app/(app)` contains authenticated app routes, transaction route placeholders, and nested tabs.
- `app/(app)/(tabs)` contains the authenticated bottom navigation shell.
- `providers/` composes backend session restoration, bootstrap/access state, React Query, native connectivity integration, and global error handling.
- `services/api/core/` contains request transport, timeout, bearer header, query string, JSON parsing, and normalized API errors.
- `services/api/*.ts` contains domain API modules such as auth, dashboard, accounts, transactions, planning, shared, reports, and onboarding.
- `services/api/*.types.ts` keeps backend DTOs beside their domain modules. `services/api/types.ts` is only a compatibility barrel plus shared primitives.
- `stores/` contains small Zustand stores. The backend token is kept in memory and persisted only through Expo Secure Store. Onboarding stores draft form values only.
- `theme/` contains typed design tokens consumed by app code and NativeWind/Tailwind.
- `components/` contains reusable UI, layout, card, chart, and form primitives.
- `features/` contains feature-owned surfaces. Dashboard and supporting authenticated pages consume backend APIs; financial calculations stay on the backend.
- `features/onboarding/` contains the setup coordinator, step components, Zod validation, options, and the onboarding flow hook.

## Backend Auth Model

The backend owns vault PIN authentication, authorization, financial calculations, Safe to Spend, cycle logic, and shared settlement logic.

Mobile authentication flow:

1. Mobile will submit vault name and PIN to `POST /api/login`.
2. The backend validates the PIN against the existing Money Vault behavior.
3. The backend returns a bearer token and safe vault metadata.
4. Mobile stores only the bearer token in Expo Secure Store.
5. Mobile sends `Authorization: Bearer <token>` on API requests.

The centralized app access state is:

- `booting`
- `signed-out`
- `onboarding`
- `ready`

Setup completion is backend-owned. The app does not persist an onboarding-complete flag locally. It stores only safe draft values so setup can resume later, and it reloads setup status from the backend before entering the ready app.

## Onboarding Model

Money Vault has exactly one Personal Vault per user. First-time setup automatically works against that Personal Vault and does not ask the user to choose Personal versus Shared. Shared Vaults are added later from the authenticated experience.

The current mobile onboarding flow is intentionally persistence-first:

- Welcome
- Vault name
- First account type
- Account details
- Financial cycle
- Optional savings goal
- Notifications
- Finish

Placeholder onboarding service methods throw `OnboardingApiNotImplementedError` until backend endpoints exist. The app must not mark setup complete unless the backend confirms persistence.

## API Boundary

The API client is split by domain while preserving the public `apiClient` object for existing callers. Implemented client groups include auth, dashboard, accounts, categories, transactions, transfers, planning, shared, wishlist, reports, settings, and onboarding placeholders.

The Dashboard screen renders the backend response contract: `generatedAt`, `vault`, and nested `data` fields for cycle, Safe to Spend, financial snapshot, recent activity, and spending by category.

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
  api/
    core/
stores/
hooks/
lib/
constants/
theme/
types/
assets/
```

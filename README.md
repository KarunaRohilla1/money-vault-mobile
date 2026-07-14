# Money Vault 2.0 Mobile

Production React Native foundation for Money Vault 2.0. The mobile app is an API client only:

```text
React Native mobile app -> FastAPI backend -> Supabase/PostgreSQL
```

The mobile app must not query Supabase financial tables directly and must never contain a Supabase service-role key.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set the backend API URL.
4. Start Expo with `npm start`.

## Environment Variables

```text
EXPO_PUBLIC_API_BASE_URL=
```

Do not commit `.env` or secrets. This value points to the Money Vault backend API, not Supabase.

## Architecture

- `app/(auth)` contains the backend vault login route placeholder.
- `app/(app)` contains authenticated app routes, transaction route placeholders, and nested tabs.
- `app/(app)/(tabs)` contains the authenticated bottom navigation shell.
- `providers/` composes backend session restoration, bootstrap/access state, React Query, native connectivity integration, and global error handling.
- `services/api/` contains the typed backend API client and Secure Store token persistence.
- `stores/` contains small Zustand stores. The backend token is kept in memory and persisted only through Expo Secure Store.
- `theme/` contains typed design tokens consumed by app code and NativeWind/Tailwind.
- `components/` contains reusable UI, layout, card, chart, and form primitives.
- `features/` contains feature-owned placeholder surfaces only.

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
- `ready`

## API Boundary

Current typed client functions:

- `POST /api/login`
- `GET /api/dashboard`

Dashboard UI is intentionally not implemented in this repository yet.

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
stores/
hooks/
lib/
constants/
theme/
types/
assets/
```

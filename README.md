# Money Vault 2.0 Mobile

Production React Native foundation for Money Vault 2.0. The mobile app is an API client only:

```text
React Native mobile app -> FastAPI backend -> Supabase/PostgreSQL
```

The mobile app must not query Supabase financial tables directly and must never contain a Supabase service-role key.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Point the app at your local API (auto-detects your LAN IP for a physical device):

```bash
npm run api:url:device
# or: npm run api:url:emulator
# or: npm run api:url:simulator
```

4. In the `money-vault` backend repo, start the API on all interfaces:

```bash
python scripts/run_api_local.py
```

5. Start Expo against that local API:

```bash
npm run start:local
```

Production/EAS builds keep using Cloud Run. Local/lower builds use `EXPO_PUBLIC_API_BASE_URL` and allow cleartext HTTP to your machine.

## Environment Variables

```text
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_APP_ENV=development
```

Do not commit `.env` or secrets. This value points to the Money Vault backend API, not Supabase.

| Client | Typical URL |
| --- | --- |
| Physical phone (same Wi‑Fi) | `http://<your-lan-ip>:8001` via `npm run api:url:device` |
| Android emulator | `http://10.0.2.2:8001` |
| iOS simulator | `http://127.0.0.1:8001` |

If you previously logged in against production, sign out and log in again after switching to local so the token matches the local `JWT_SECRET`.

## Architecture

- `app/(auth)` contains backend vault login routes.
- `app/(app)` contains authenticated app routes, transaction route placeholders, and nested tabs.
- `app/(app)/(tabs)` contains the authenticated bottom navigation shell.
- `providers/` composes backend session restoration, bootstrap/access state, React Query, native connectivity integration, and global error handling.
- `services/api/core/` contains request transport, timeout, bearer header, query string, JSON parsing, and normalized API errors.
- `services/api/*.ts` contains domain API modules such as auth, dashboard, accounts, transactions, planning, shared, reports, and onboarding.
- `services/api/*.types.ts` keeps backend DTOs beside their domain modules. `services/api/types.ts` is only a compatibility barrel plus shared primitives.
- `stores/` contains small Zustand stores. The backend token is kept in memory and persisted only through Expo Secure Store. Onboarding stores safe local draft values and mobile setup completion while backend setup endpoints are pending.
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

Backend setup status is preferred when available. While backend onboarding endpoints are pending, the mobile app stores safe local onboarding completion so first-run setup remains seamless and does not block the user on unavailable endpoints.

## Onboarding Model

Money Vault has exactly one Personal Vault per user. First-time setup automatically works against that Personal Vault and does not ask the user to choose Personal versus Shared. Shared Vaults are added later from the authenticated experience.

The current mobile onboarding flow is local-draft first and backend-compatible:

- Welcome
- Vault name
- First account type
- Account details
- Financial cycle
- Optional savings goal
- Finish

Intermediate onboarding steps save locally and advance without showing backend placeholder errors. Personal Vault provisioning still requires an authenticated Personal/Individual vault from login; Shared Vault setup is blocked from the first-run flow.

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

## Planning Architecture

Planning follows the same API-first boundary as Dashboard:

```text
FastAPI Planning DTO -> services/api/planning.ts -> features/planning/planningModel.ts adapter -> Planning UI components
```

The backend owns Planning financial logic, including cycle progress, chronological activities, timeline ordering, completion percentages, projected savings, remaining commitments, close-cycle readiness, and close-cycle review/finalization. The mobile app renders the returned view model and only keeps local UI draft state for forms, sheets, and modals.

Primary endpoints consumed by mobile:

- `GET /api/planning` returns the cycle, totals, recurring templates, backend-built activities, timeline, cycle progress, completion status, and close readiness.
- `POST /api/planning/commitments` / `PUT /api/planning/commitments/{id}` / `DELETE /api/planning/commitments/{id}` manage recurring commitments.
- `POST /api/planning/income-templates` / `PUT /api/planning/income-templates/{id}` / `DELETE /api/planning/income-templates/{id}` manage recurring income.
- `POST /api/planning/commitments/{id}/status` and `POST /api/planning/income-templates/{id}/status` update actual activity state through backend validation.
- `POST /api/planning/cycles/close-active` accepts the close review payload and reuses the legacy `finalize_month` / `close_active_cycle` workflow.

React Query hooks in `features/planning/api.ts` invalidate Planning, Dashboard, Accounts, and Transactions after mutations so the financial surfaces stay synchronized.

# Money Vault Mobile Deployment Readiness

Date: 2026-07-30

## Summary

The mobile repository is close to deployment-ready from a configuration and security hygiene perspective. No tracked hardcoded secrets or backend URLs were found in source scans. Environment configuration is centralized, and `.env` is ignored.

Before production deployment, verify Expo SDK compatibility, backend URL configuration, and the current dirty worktree.

## Environment Configuration

### Required variable

```bash
EXPO_PUBLIC_API_BASE_URL=
```

Source:

- `.env.example` documents Android emulator and physical-device usage.
- `lib/env.ts` validates the API base URL with Zod.
- `app.json` maps `extra.apiBaseUrl` to `$EXPO_PUBLIC_API_BASE_URL`.

### Local examples

- Android emulator: `http://10.0.2.2:8001`
- Physical device: computer LAN IP, for example `http://192.168.1.25:8001`

### Production requirement

Production builds must point `EXPO_PUBLIC_API_BASE_URL` to the deployed HTTPS Money Vault backend API.

## Secret Handling

Verified by scan:

- No tracked hardcoded `http://` or `https://` URLs were found outside ignored/generated files and docs.
- No tracked obvious secret keywords were found in source scan.
- `.env` is ignored by `.gitignore`.
- The mobile app uses backend JWT storage through Expo Secure Store.
- The mobile app does not contain Supabase service-role keys.

Do not commit:

- `.env`
- JWTs
- PINs
- financial exports
- private backend URLs if not intended for source control
- native build artifacts

## Git Ignore and Generated Files

Ignored paths include:

- `node_modules/`
- `.npm-cache/`
- `.expo/`
- `dist/`
- `web-build/`
- `android/`
- `.env`
- `.env.local`
- `docs/`

Note: `docs/` is ignored while existing docs are tracked. New docs under `docs/` may require explicit `git add -f` if they should be committed.

## Build Configuration

### Expo configuration

- App name: `Money Vault`
- Slug: `money-vault-mobile`
- Scheme: `moneyvault`
- Dark mode only via `userInterfaceStyle: "dark"`
- Android package: `com.karunarohilla.moneyvaultmobile`
- EAS project ID configured in `app.json`

### EAS profiles

- `development` uses development client and internal distribution.
- `preview` uses internal distribution.
- `production` auto-increments version remotely.

## Dependency State

`npm ls --depth=0` completed successfully and showed installed root dependencies.

Production-readiness note: run `npx expo install --check` before building to verify package versions against the installed Expo SDK. Only fix SDK compatibility issues, not unrelated upgrades.

Current notable package versions:

- Expo `~57.0.6`
- React Native `0.86.0`
- React `19.2.3`
- Expo Router `~57.0.6`
- React Query `5.101.2`
- Zustand `5.0.14`

## Validation Commands

Current audit validation:

- `npm run typecheck` passed.
- `npm run lint` passed after generated/cache directories were explicitly ignored in ESLint config.

Recommended full pre-release gate:

```bash
npm run validate
npx expo install --check
npx expo-doctor
```

If native dependencies or plugins change, rebuild the EAS development client before device testing.

## Production Risks

1. Dirty worktree: there are existing uncommitted feature changes unrelated to this audit. Stabilization should be committed separately from feature/UI changes if possible.
2. Reports legacy code: multiple Reports presentation paths exist, increasing future maintenance risk.
3. Ignored docs folder: source-controlled docs policy is inconsistent.
4. Expo generated files: `.expo` should remain ignored and should not be part of lint or commits.
5. Backend availability: production mobile builds require a stable HTTPS backend endpoint.
6. Secure Store availability: device builds must include `expo-secure-store`; development clients need rebuilds after native plugin changes.

## Release Checklist

Before production deployment:

- Confirm `.env` is not staged.
- Confirm `EXPO_PUBLIC_API_BASE_URL` points to HTTPS production backend.
- Run `npm run validate`.
- Run `npx expo install --check`.
- Run `npx expo-doctor`.
- Build a fresh EAS development build if native config/dependencies changed.
- Smoke test login, session restore, logout, Dashboard, Accounts, Transactions, Transfers, Planning, Reports, Categories, Wishlist, and More on a real Android device.
- Confirm no private financial exports or screenshots are staged.
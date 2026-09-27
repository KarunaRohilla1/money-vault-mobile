import type { AppAccessState } from "@/stores/accessStore";

const SIGNED_OUT_AUTH_ROUTES = ["/welcome", "/sign-in", "/sign-up", "/forgot-pin"] as const;
const ONBOARDING_ROUTE = "/onboarding";
const RECOVERY_CODE_ROUTE = "/recovery-code";

function isSignedOutAuthRoute(pathname: string) {
  return (SIGNED_OUT_AUTH_ROUTES as readonly string[]).includes(pathname);
}

function isOnboardingRoute(pathname: string) {
  return pathname === ONBOARDING_ROUTE;
}

function isRecoveryCodeRoute(pathname: string) {
  return pathname === RECOVERY_CODE_ROUTE;
}

export function targetRouteForAccessState(
  accessState: AppAccessState,
  options?: { pendingRecoveryCode?: boolean }
) {
  if (options?.pendingRecoveryCode && (accessState === "onboarding" || accessState === "ready")) {
    return RECOVERY_CODE_ROUTE;
  }

  switch (accessState) {
    case "signed-out":
      return "/welcome";
    case "onboarding":
      return "/onboarding";
    case "ready":
      return "/";
    case "booting":
      return null;
  }
}

/** True when AccessGate should leave the current path for the access-state target. */
export function needsAccessRedirect(
  accessState: AppAccessState,
  pathname: string,
  options?: { pendingRecoveryCode?: boolean }
) {
  if (options?.pendingRecoveryCode) {
    if (accessState === "booting" || accessState === "signed-out") {
      return accessState === "signed-out" ? !isSignedOutAuthRoute(pathname) : false;
    }
    return !isRecoveryCodeRoute(pathname);
  }

  switch (accessState) {
    case "booting":
      return false;
    case "signed-out":
      return !isSignedOutAuthRoute(pathname);
    case "onboarding":
      return !isOnboardingRoute(pathname);
    case "ready":
      return isSignedOutAuthRoute(pathname) || isOnboardingRoute(pathname) || isRecoveryCodeRoute(pathname);
  }
}

import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { targetRouteForAccessState } from "@/lib/accessRoutes";
import { useAccessStore } from "@/stores/accessStore";

export function AccessGate() {
  const accessState = useAccessStore((state) => state.accessState);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const targetRoute = targetRouteForAccessState(accessState);

    if (!targetRoute) {
      return;
    }

    const routeSegments: readonly string[] = segments;
    const routeGroup = routeSegments[0];
    const routeName = routeSegments[1];
    const inAuthGroup = routeGroup === "(auth)";
    const inAppGroup = routeGroup === "(app)";
    const alreadySignedOut = inAuthGroup && routeName === "sign-in";
    const alreadyOnboarding = inAppGroup && routeName === "onboarding";
    const alreadyReady = inAppGroup && routeName !== "onboarding";

    if (
      (accessState === "signed-out" && alreadySignedOut) ||
      (accessState === "onboarding" && alreadyOnboarding) ||
      (accessState === "ready" && alreadyReady)
    ) {
      return;
    }

    router.replace(targetRoute);
  }, [accessState, router, segments]);

  return null;
}

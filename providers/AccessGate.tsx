import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAccessStore } from "@/stores/accessStore";

function targetRouteForAccessState(accessState: ReturnType<typeof useAccessStore.getState>["accessState"]) {
  switch (accessState) {
    case "signed-out":
      return "/sign-in";
    case "selecting-vault":
      return "/vault-selection";
    case "vault-locked":
      return "/pin-unlock";
    case "ready":
      return "/";
    case "booting":
      return null;
  }
}

export function AccessGate() {
  const accessState = useAccessStore((state) => state.accessState);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const targetRoute = targetRouteForAccessState(accessState);

    if (!targetRoute) {
      return;
    }

    const routeGroup = segments[0];
    const routeName = segments[1];
    const inAuthGroup = routeGroup === "(auth)";
    const inAppGroup = routeGroup === "(app)";
    const alreadySignedOut = inAuthGroup && routeName === "sign-in";
    const alreadySelectingVault = inAppGroup && routeName === "vault-selection";
    const alreadyVaultLocked = inAuthGroup && routeName === "pin-unlock";
    const alreadyReady = inAppGroup && routeName !== "vault-selection";

    if (
      (accessState === "signed-out" && alreadySignedOut) ||
      (accessState === "selecting-vault" && alreadySelectingVault) ||
      (accessState === "vault-locked" && alreadyVaultLocked) ||
      (accessState === "ready" && alreadyReady)
    ) {
      return;
    }

    router.replace(targetRoute);
  }, [accessState, router, segments]);

  return null;
}

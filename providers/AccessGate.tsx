import { usePathname, useRouter, type Href } from "expo-router";
import { useEffect } from "react";

import { needsAccessRedirect, targetRouteForAccessState } from "@/lib/accessRoutes";
import { useAccessStore } from "@/stores/accessStore";
import { useRecoveryCodeStore } from "@/stores/recoveryCodeStore";

export function AccessGate() {
  const accessState = useAccessStore((state) => state.accessState);
  const pendingRecoveryCode = useRecoveryCodeStore((state) => Boolean(state.pendingCode));
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const options = { pendingRecoveryCode };
    const targetRoute = targetRouteForAccessState(accessState, options);

    if (!targetRoute || !needsAccessRedirect(accessState, pathname, options)) {
      return;
    }

    router.replace(targetRoute as Href);
  }, [accessState, pathname, pendingRecoveryCode, router]);

  return null;
}

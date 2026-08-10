import type { Href } from "expo-router";

interface NavigationRouter {
  back: () => void;
  canGoBack?: () => boolean;
  replace: (href: Href) => void;
}

export function goBackOrReplace(router: NavigationRouter, fallback: Href) {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

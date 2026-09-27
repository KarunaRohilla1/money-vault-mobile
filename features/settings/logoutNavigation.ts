import type { Href } from "expo-router";

interface LogoutNavigationRouter {
  canDismiss?: () => boolean;
  dismissAll: () => void;
  replace: (href: Href) => void;
}

export function resetNavigationAfterLogout(router: LogoutNavigationRouter) {
  if (router.canDismiss?.()) {
    router.dismissAll();
  }

  router.replace("/welcome" as unknown as Href);
}

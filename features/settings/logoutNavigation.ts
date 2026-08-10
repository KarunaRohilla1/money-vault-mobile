interface LogoutNavigationRouter {
  canDismiss?: () => boolean;
  dismissAll: () => void;
  replace: (href: "/sign-in") => void;
}

export function resetNavigationAfterLogout(router: LogoutNavigationRouter) {
  if (router.canDismiss?.()) {
    router.dismissAll();
  }

  router.replace("/sign-in");
}

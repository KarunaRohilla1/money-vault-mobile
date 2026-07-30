interface LogoutNavigationRouter {
  dismissAll: () => void;
  replace: (href: "/sign-in") => void;
}

export function resetNavigationAfterLogout(router: LogoutNavigationRouter) {
  router.dismissAll();
  router.replace("/sign-in");
}
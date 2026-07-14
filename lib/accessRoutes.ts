import type { AppAccessState } from "@/stores/accessStore";

export function targetRouteForAccessState(accessState: AppAccessState) {
  switch (accessState) {
    case "signed-out":
      return "/sign-in";
    case "ready":
      return "/";
    case "booting":
      return null;
  }
}

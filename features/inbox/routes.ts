import type { Href } from "expo-router";

export const inboxRoutes = {
  approved: "/inbox/approved" as Href,
  capture: "/inbox/capture" as Href,
  duplicate: "/inbox/duplicate" as Href,
  parsing: "/inbox/parsing" as Href,
  review: "/inbox/review" as Href,
  root: "/inbox" as Href
} as const;

import type { PropsWithChildren } from "react";

import { useNotifications } from "@/features/notifications/hooks/useNotifications";

export function NotificationProvider({ children }: PropsWithChildren) {
  useNotifications();
  return <>{children}</>;
}

import { useInboxQuery } from "@/features/inbox/api";
import { useAuthStore } from "@/stores/authStore";

export function useInbox() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const query = useInboxQuery(token, vaultId);

  const inbox = query.data ?? {
    failed: [],
    needsReview: [],
    pendingCount: 0,
    ready: [],
    totalCount: 0
  };

  return {
    ...query,
    failed: inbox.failed,
    inbox,
    needsReview: inbox.needsReview,
    pendingCount: inbox.pendingCount,
    ready: inbox.ready,
    token,
    totalCount: inbox.totalCount,
    vaultId
  };
}

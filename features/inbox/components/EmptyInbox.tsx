import { EmptyState } from "@/components/ui";
import { INBOX_COPY } from "@/features/inbox/inboxModel";

export function EmptyInbox() {
  return (
    <EmptyState
      icon="inbox-outline"
      message={INBOX_COPY.emptyMessage}
      title={INBOX_COPY.emptyTitle}
    />
  );
}

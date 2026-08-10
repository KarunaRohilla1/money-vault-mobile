import { useState } from "react";
import { View } from "react-native";

import { ErrorView, LoadingSkeleton } from "@/components/ui";
import { EmptySettlementState } from "@/features/settlements/components/EmptySettlementState";
import { SettlementDetailsSheet } from "@/features/settlements/components/SettlementDetailsSheet";
import { SettlementHistoryCard } from "@/features/settlements/components/SettlementHistoryCard";
import { useSettlementHistory } from "@/features/settlements/hooks/useSettlementHistory";
import type { SettlementDetailsViewModel, SettlementListItem } from "@/features/settlements/types";
import type { CurrencyCode } from "@/types/domain";

function SettlementHistorySectionSkeleton() {
  return (
    <View className="gap-3">
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </View>
  );
}

export function SettlementHistorySection({
  currencyCode,
  locale,
  sharedVaultId = null
}: {
  currencyCode: CurrencyCode | string;
  locale: string;
  sharedVaultId?: number | null;
}) {
  const history = useSettlementHistory({ previewLimit: 3, sharedVaultId });
  const [details, setDetails] = useState<SettlementDetailsViewModel | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  function openDetails(item: SettlementListItem) {
    setDetails(history.detailsFor(item));
    setDetailsVisible(true);
  }

  function closeDetails() {
    setDetailsVisible(false);
  }

  return (
    <>
      {history.loading ? (
        <SettlementHistorySectionSkeleton />
      ) : history.error ? (
        <ErrorView message="Couldn't load settlement history." onRetry={history.refresh} />
      ) : history.preview.length === 0 ? (
        <EmptySettlementState />
      ) : (
        <View className="gap-3">
          {history.preview.map((item) => (
            <SettlementHistoryCard
              key={item.id}
              currencyCode={currencyCode}
              item={item}
              locale={locale}
              onPress={openDetails}
              variant="compact"
            />
          ))}
        </View>
      )}

      <SettlementDetailsSheet
        currencyCode={currencyCode}
        details={details}
        locale={locale}
        onClose={closeDetails}
        visible={detailsVisible}
      />
    </>
  );
}

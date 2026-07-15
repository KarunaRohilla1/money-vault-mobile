import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useTransfersQuery } from "@/features/transfers/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

export function TransfersScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const transfersQuery = useTransfersQuery(token, vaultId);

  return (
    <Screen>
      <ScreenHeader title="Transfers" description="Transfers are modeled as paired legacy transfer transactions." />
      {transfersQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {transfersQuery.isError ? <ErrorView message="Transfers could not be loaded." onRetry={() => transfersQuery.refetch()} /> : null}
      {transfersQuery.data?.length === 0 ? <EmptyState icon="bank-transfer" title="No transfers" message="Account transfers will appear here." /> : null}
      {transfersQuery.data && transfersQuery.data.length > 0 ? (
        <Section title="Transfer history">
          <View className="gap-3">
            {transfersQuery.data.map((transfer) => (
              <View key={transfer.transferGroupId} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                    <MaterialCommunityIcons name="bank-transfer" size={22} color={theme.colors.brand.soft} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-sm font-semibold text-text">
                      {transfer.fromAccountName} → {transfer.toAccountName}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted">{transfer.date}</Text>
                  </View>
                  <CurrencyText value={transfer.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                </View>
                {transfer.notes ? <Text className="font-sans text-xs text-text-muted">{transfer.notes}</Text> : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

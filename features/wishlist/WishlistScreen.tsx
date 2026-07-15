import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useWishlistQuery } from "@/features/wishlist/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function WishlistScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const wishlistQuery = useWishlistQuery(token, vaultId);

  return (
    <Screen>
      <ScreenHeader title="Wishlist" description="Track savings progress toward planned purchases." />
      {wishlistQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {wishlistQuery.isError ? <ErrorView message="Wishlist could not be loaded." onRetry={() => wishlistQuery.refetch()} /> : null}
      {wishlistQuery.data ? (
        <View className="gap-6">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Wishlist Progress</Text>
                <Text className="font-sans text-xl font-bold text-text">{wishlistQuery.data.summary.progress}% saved</Text>
              </View>
              <CurrencyText
                value={wishlistQuery.data.summary.totalSaved}
                currencyCode={currencyCode}
                locale={locale}
                className="text-lg font-semibold"
              />
            </View>
            <Text className="font-sans text-sm text-text-muted">
              {wishlistQuery.data.summary.totalItems} items ·{" "}
              <CurrencyText value={wishlistQuery.data.summary.totalCost} currencyCode={currencyCode} locale={locale} className="text-sm text-text-muted" />
            </Text>
          </View>

          {wishlistQuery.data.items.length === 0 ? (
            <EmptyState icon="gift-outline" title="No wishlist items" message="Wishlist items from this vault will appear here." />
          ) : (
            <Section title="Items">
              <View className="gap-3">
                {wishlistQuery.data.items.map((item) => (
                  <View key={item.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                    <View className="flex-row justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-sans text-base font-semibold text-text">{item.name}</Text>
                        <Text className="font-sans text-xs text-text-muted">
                          {item.category}
                          {item.targetDate ? ` · ${item.targetDate}` : ""}
                        </Text>
                      </View>
                      <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                    </View>
                    <Text className="font-sans text-xs text-text-muted">
                      Saved{" "}
                      <CurrencyText value={item.savedAmount} currencyCode={currencyCode} locale={locale} className="text-xs text-text-muted" /> ·{" "}
                      {item.progressPercent}%
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

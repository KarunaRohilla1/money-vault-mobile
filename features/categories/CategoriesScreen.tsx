import { Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useCategoriesQuery } from "@/features/categories/api";
import { useAuthStore } from "@/stores/authStore";

export function CategoriesScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const incomeCategories = categoriesQuery.data?.filter((category) => category.categoryType === "Income") ?? [];
  const expenseCategories = categoriesQuery.data?.filter((category) => category.categoryType !== "Income") ?? [];

  return (
    <Screen>
      <ScreenHeader title="Categories" description="System and custom categories follow legacy restrictions." />
      {categoriesQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {categoriesQuery.isError ? <ErrorView message="Categories could not be loaded." onRetry={() => categoriesQuery.refetch()} /> : null}
      {categoriesQuery.data?.length === 0 ? <EmptyState icon="shape-outline" title="No categories" message="Categories will appear here." /> : null}
      {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
        <View className="gap-6">
          <CategoryGroup title="Expense categories" categories={expenseCategories} />
          <CategoryGroup title="Income categories" categories={incomeCategories} />
        </View>
      ) : null}
    </Screen>
  );
}

interface CategoryGroupProps {
  categories: {
    categoryType: string;
    emoji: string;
    id: number;
    isSystem: boolean;
    name: string;
    parentCategory?: string | null;
  }[];
  title: string;
}

function CategoryGroup({ categories, title }: CategoryGroupProps) {
  return (
    <Section title={title}>
      <View className="gap-2">
        {categories.map((category) => (
          <View key={category.id} className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <Text className="text-xl">{category.emoji}</Text>
            <View className="flex-1">
              <Text className="font-sans text-sm font-semibold text-text">{category.name}</Text>
              <Text className="font-sans text-xs text-text-muted">
                {category.parentCategory ?? "Custom"}
                {category.isSystem ? " · System" : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

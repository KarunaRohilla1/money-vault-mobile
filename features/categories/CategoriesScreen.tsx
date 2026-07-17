import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation
} from "@/features/categories/api";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";
import type { CategoryApi } from "@/services/api/types";

const CATEGORY_TYPES = ["Expense", "Income"] as const;

interface CategoryFormState {
  categoryType: string;
  emoji: string;
  id: number | null;
  name: string;
}

const EMPTY_FORM: CategoryFormState = {
  categoryType: CATEGORY_TYPES[0],
  emoji: "tag",
  id: null,
  name: ""
};

export function CategoriesScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const createMutation = useCreateCategoryMutation(token, vaultId);
  const updateMutation = useUpdateCategoryMutation(token, vaultId);
  const deleteMutation = useDeleteCategoryMutation(token, vaultId);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const incomeCategories = categoriesQuery.data?.filter((category) => category.categoryType === "Income") ?? [];
  const expenseCategories = categoriesQuery.data?.filter((category) => category.categoryType !== "Income") ?? [];
  const formError = useMemo(() => (!form.name.trim() ? "Category name is required." : null), [form.name]);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submit = () => {
    if (formError) {
      return;
    }

    const body = {
      categoryType: form.categoryType,
      emoji: form.emoji.trim() || "tag",
      name: form.name.trim()
    };

    if (form.id) {
      updateMutation.mutate(
        {
          body,
          categoryId: form.id
        },
        {
          onSuccess: () => setForm(EMPTY_FORM)
        }
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => setForm(EMPTY_FORM)
    });
  };

  const editCategory = (category: CategoryApi) => {
    setForm({
      categoryType: category.categoryType,
      emoji: category.emoji,
      id: category.id,
      name: category.name
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Categories" description="System and custom categories follow legacy restrictions." />
      {categoriesQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {categoriesQuery.isError ? <ErrorView message="Categories could not be loaded." onRetry={() => categoriesQuery.refetch()} /> : null}

      <Section title={form.id ? "Edit category" : "Add category"}>
        <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
          <FormField label="Name" error={formError ?? undefined}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="Groceries"
              placeholderTextColor={theme.colors.text.muted}
              value={form.name}
            />
          </FormField>
          <FormField label="Icon">
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onChangeText={(emoji) => setForm((current) => ({ ...current, emoji }))}
              placeholder="tag"
              placeholderTextColor={theme.colors.text.muted}
              value={form.emoji}
            />
          </FormField>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_TYPES.map((categoryType) => (
              <SecondaryButton
                key={categoryType}
                className={form.categoryType === categoryType ? "border-brand-soft" : undefined}
                onPress={() => setForm((current) => ({ ...current, categoryType }))}
              >
                {categoryType}
              </SecondaryButton>
            ))}
          </View>
          <View className="flex-row gap-2">
            <PrimaryButton disabled={Boolean(formError) || isSaving} onPress={submit}>
              {form.id ? "Save category" : "Add category"}
            </PrimaryButton>
            {form.id ? <SecondaryButton onPress={() => setForm(EMPTY_FORM)}>Cancel</SecondaryButton> : null}
          </View>
        </View>
      </Section>

      {categoriesQuery.data?.length === 0 ? <EmptyState icon="shape-outline" title="No categories" message="Categories will appear here." /> : null}
      {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
        <View className="gap-6">
          <CategoryGroup
            categories={expenseCategories}
            deleting={deleteMutation.isPending}
            onDelete={(categoryId) => deleteMutation.mutate(categoryId)}
            onEdit={editCategory}
            title="Expense categories"
          />
          <CategoryGroup
            categories={incomeCategories}
            deleting={deleteMutation.isPending}
            onDelete={(categoryId) => deleteMutation.mutate(categoryId)}
            onEdit={editCategory}
            title="Income categories"
          />
        </View>
      ) : null}
    </Screen>
  );
}

interface CategoryGroupProps {
  categories: CategoryApi[];
  deleting: boolean;
  onDelete: (categoryId: number) => void;
  onEdit: (category: CategoryApi) => void;
  title: string;
}

function CategoryGroup({ categories, deleting, onDelete, onEdit, title }: CategoryGroupProps) {
  return (
    <Section title={title}>
      <View className="gap-2">
        {categories.map((category) => (
          <View key={category.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">{category.emoji}</Text>
              <View className="flex-1">
                <Text className="font-sans text-sm font-semibold text-text">{category.name}</Text>
                <Text className="font-sans text-xs text-text-muted">
                  {category.parentCategory ?? "Custom"}
                  {category.isSystem ? " - System" : ""}
                </Text>
              </View>
            </View>
            {!category.isSystem ? (
              <View className="flex-row gap-2">
                <SecondaryButton onPress={() => onEdit(category)}>Edit</SecondaryButton>
                <SecondaryButton disabled={deleting} onPress={() => onDelete(category.id)}>
                  Delete
                </SecondaryButton>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Section>
  );
}

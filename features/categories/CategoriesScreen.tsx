import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { BottomSheet, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { CategoryIcon } from "@/features/categories/components/CategoryIcon";
import { CategoryTypeSelector } from "@/features/categories/components/CategoryTypeSelector";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation
} from "@/features/categories/api";
import {
  CATEGORY_FILTERS,
  DEFAULT_CATEGORY_EMOJI,
  LEGACY_CATEGORY_ICONS,
  categoryCounts,
  categoryType,
  filterAndSortCategories,
  hasCategoryChanges,
  isSystemCategory,
  normalizeCategoryPayload,
  validateCategoryForm
} from "@/features/categories/categoryModel";
import type { CategoryFilter } from "@/features/categories/categoryModel";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";
import type { CategoryApi } from "@/services/api/types";

interface CategoryFormState {
  categoryType: string | null;
  emoji: string | null;
  id: number | null;
  name: string;
}

const EMPTY_FORM: CategoryFormState = {
  categoryType: null,
  emoji: null,
  id: null,
  name: ""
};

const chipIcons: Record<CategoryFilter, ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  All: "shape-outline",
  Custom: "account-outline",
  Expense: "trending-down",
  Income: "trending-up",
  System: "lock-outline"
};

export function CategoriesScreen() {
  const { width } = useWindowDimensions();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const createMutation = useCreateCategoryMutation(token, vaultId);
  const updateMutation = useUpdateCategoryMutation(token, vaultId);
  const deleteMutation = useDeleteCategoryMutation(token, vaultId);
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [formVisible, setFormVisible] = useState(false);
  const [openMenuCategoryId, setOpenMenuCategoryId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CategoryApi | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const counts = useMemo(() => categoryCounts(categories), [categories]);
  const filteredCategories = useMemo(
    () => filterAndSortCategories(categories, { filter, search: debouncedSearch, sort: "A_TO_Z" }),
    [categories, debouncedSearch, filter]
  );
  const validation = useMemo(() => validateCategoryForm(form, categories), [categories, form]);
  const hasChanges = useMemo(() => hasCategoryChanges(initialForm, form), [form, initialForm]);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canSave = validation.isValid && (!form.id || hasChanges) && !isSaving;

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function refresh() {
    void categoriesQuery.refetch();
  }

  function openAddForm() {
    const nextForm = EMPTY_FORM;
    setForm(nextForm);
    setInitialForm(nextForm);
    setMutationError(null);
    setFormVisible(true);
  }

  function openEditForm(category: CategoryApi) {
    if (isSystemCategory(category)) {
      setMutationError("System categories cannot be edited.");
      return;
    }

    setForm({
      categoryType: category.categoryType,
      emoji: category.emoji || DEFAULT_CATEGORY_EMOJI,
      id: category.id,
      name: category.name
    });
    setInitialForm({
      categoryType: category.categoryType,
      emoji: category.emoji || DEFAULT_CATEGORY_EMOJI,
      id: category.id,
      name: category.name
    });
    setMutationError(null);
    setOpenMenuCategoryId(null);
    setFormVisible(true);
  }

  function closeForm() {
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setFormVisible(false);
    setMutationError(null);
  }

  function submit() {
    if (!canSave || !form.categoryType || !form.emoji) {
      return;
    }

    const body = normalizeCategoryPayload({
      categoryType: form.categoryType,
      emoji: form.emoji,
      name: form.name
    });

    if (form.id) {
      updateMutation.mutate(
        {
          body,
          categoryId: form.id
        },
        {
          onError: (error) => setMutationError(error instanceof Error ? error.message : "Category could not be updated."),
          onSuccess: closeForm
        }
      );
      return;
    }

    createMutation.mutate(body, {
      onError: (error) => setMutationError(error instanceof Error ? error.message : "Category could not be created."),
      onSuccess: closeForm
    });
  }

  function deleteCategory(category: CategoryApi) {
    if (isSystemCategory(category)) {
      setMutationError("System categories cannot be deleted.");
      return;
    }

    deleteMutation.mutate(category.id, {
      onError: (error) => setMutationError(error instanceof Error ? error.message : "Category could not be deleted."),
      onSuccess: () => {
        setOpenMenuCategoryId(null);
        setDeleteCandidate(null);
        setMutationError(null);
      }
    });
  }

  if (categoriesQuery.isLoading) {
    return (
      <Screen>
        <CategoriesHeader compact={width < 390} onAdd={openAddForm} />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (categoriesQuery.isError && categories.length === 0) {
    return (
      <Screen>
        <CategoriesHeader compact={width < 390} onAdd={openAddForm} />
        <ErrorView message="Categories could not be loaded." onRetry={() => void categoriesQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <>
      <Screen contentClassName="gap-4 px-4 pb-32" onRefresh={refresh} refreshing={categoriesQuery.isRefetching}>
        <CategoriesHeader compact={width < 390} onAdd={openAddForm} />
        <SearchBar value={searchInput} onChange={setSearchInput} />
        <FilterChips active={filter} counts={counts} onChange={setFilter} />
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-sm font-semibold text-text-muted">Categories ({filteredCategories.length})</Text>
          <Pressable accessibilityRole="button" className="flex-row items-center gap-1">
            <Text className="font-sans text-sm text-text-muted">Sort: A → Z</Text>
            <MaterialCommunityIcons name="chevron-down" size={theme.icons.xs} color={theme.colors.text.muted} />
          </Pressable>
        </View>
        {filteredCategories.length === 0 ? (
          <EmptyState icon="shape-outline" title={categories.length === 0 ? "No categories" : "No categories found"} message="Try a different search or filter." />
        ) : (
          <View className="gap-1">
            {filteredCategories.map((category) => (
              <CategoryRow
                key={category.id}
                actionOpen={openMenuCategoryId === category.id}
                category={category}
                onEdit={openEditForm}
                onRequestDelete={(value) => {
                  setOpenMenuCategoryId(null);
                  setMutationError(null);
                  setDeleteCandidate(value);
                }}
                onToggleActions={(value) => {
                  setMutationError(null);
                  setOpenMenuCategoryId((current) => (current === value.id ? null : value.id));
                }}
              />
            ))}
          </View>
        )}
        <Text className="text-center font-sans text-xs text-text-muted">{filteredCategories.length} categories</Text>
      </Screen>

      <CategoryFormSheet
        categories={categories}
        errors={validation.errors}
        error={mutationError}
        form={form}
        isSaving={isSaving}
        key={formVisible ? `category-form:${form.id ?? "new"}` : "category-form:closed"}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={submit}
        visible={formVisible}
      />

      <DeleteCategoryDialog
        category={deleteCandidate}
        deleting={deleteMutation.isPending}
        error={mutationError}
        onCancel={() => {
          setDeleteCandidate(null);
          setMutationError(null);
        }}
        onConfirm={deleteCategory}
      />
    </>
  );
}

function CategoriesHeader({ compact, onAdd }: { compact: boolean; onAdd: () => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable accessibilityRole="button" className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
        <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xl font-bold text-text" numberOfLines={1}>
          Categories
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={compact ? 2 : 1}>
          Manage your income and expense categories
        </Text>
      </View>
      <Pressable accessibilityRole="button" className="h-10 flex-shrink-0 flex-row items-center justify-center rounded-lg bg-brand px-3" onPress={onAdd}>
        <MaterialCommunityIcons name="plus" size={theme.icons.sm} color={theme.colors.text.inverse} />
        {!compact ? <Text className="ml-1 font-sans text-sm font-semibold text-text-inverse">Add</Text> : null}
      </Pressable>
    </View>
  );
}

function SearchBar({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <View className="h-12 flex-row rounded-xl border border-surface-border bg-surface">
      <View className="min-w-0 flex-1 flex-row items-center gap-3 px-4">
        <MaterialCommunityIcons name="magnify" size={theme.icons.md} color={theme.colors.text.muted} />
        <TextInput
          className="h-12 min-w-0 flex-1 font-sans text-base text-text"
          onChangeText={onChange}
          placeholder="Search categories..."
          placeholderTextColor={theme.colors.text.muted}
          value={value}
        />
      </View>
    </View>
  );
}

function FilterChips({
  active,
  counts,
  onChange
}: {
  active: CategoryFilter;
  counts: Record<CategoryFilter, number>;
  onChange: (filter: CategoryFilter) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
      {CATEGORY_FILTERS.map((filter) => {
        const selected = active === filter;
        return (
          <Pressable
            key={filter}
            accessibilityRole="button"
            className={selected ? "h-9 flex-row items-center gap-1.5 rounded-full bg-brand px-3" : "h-9 flex-row items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3"}
            onPress={() => onChange(filter)}
          >
            <MaterialCommunityIcons name={chipIcons[filter]} size={theme.icons.xs} color={selected ? theme.colors.text.inverse : theme.colors.brand.soft} />
            <Text className={selected ? "font-sans text-xs font-semibold text-text-inverse" : "font-sans text-xs font-semibold text-text"}>
              {filter} ({counts[filter]})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function CategoryRow({
  actionOpen,
  category,
  onEdit,
  onRequestDelete,
  onToggleActions
}: {
  actionOpen: boolean;
  category: CategoryApi;
  onEdit: (category: CategoryApi) => void;
  onRequestDelete: (category: CategoryApi) => void;
  onToggleActions: (category: CategoryApi) => void;
}) {
  const isIncome = categoryType(category) === "Income";
  const isSystem = isSystemCategory(category);

  return (
    <View className={actionOpen ? "relative z-10 min-h-[72px] flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2" : "relative min-h-[72px] flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2"}>
      <CategoryIcon category={category} size="sm" tone={isIncome ? "success" : "brand"} />
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>
          {category.name}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {category.parentCategory ?? (isSystem ? "System category" : "Custom category")}
        </Text>
      </View>
      <View className={isIncome ? "flex-shrink-0 rounded-lg bg-accent-emerald/10 px-2 py-1" : "flex-shrink-0 rounded-lg bg-accent-rose/10 px-2 py-1"}>
        <Text className={isIncome ? "font-sans text-xs font-bold text-state-success" : "font-sans text-xs font-bold text-accent-rose"}>
          {categoryType(category)}
        </Text>
      </View>
      {isSystem ? (
        <View className="h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-background-muted">
          <MaterialCommunityIcons name="lock" size={theme.icons.xs} color={theme.colors.text.muted} />
        </View>
      ) : (
        <View className="relative">
          <Pressable accessibilityLabel={`Open actions for ${category.name}`} accessibilityRole="button" className="h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-background-muted" onPress={() => onToggleActions(category)}>
            <MaterialCommunityIcons name="dots-vertical" size={theme.icons.md} color={theme.colors.text.muted} />
          </Pressable>
          {actionOpen ? (
            <View className="absolute right-0 top-9 w-36 overflow-hidden rounded-lg border border-surface-border bg-surface-raised shadow-lg">
              <Pressable
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-2 border-b border-surface-border px-3 py-2"
                onPress={() => onEdit(category)}
              >
                <MaterialCommunityIcons name="pencil-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
                <Text className="font-sans text-sm font-semibold text-text">Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-2 px-3 py-2"
                onPress={() => onRequestDelete(category)}
              >
                <MaterialCommunityIcons name="delete-outline" size={theme.icons.sm} color={theme.colors.accent.rose} />
                <Text className="font-sans text-sm font-semibold text-accent-rose">Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function CategoryFormSheet({
  categories,
  errors,
  error,
  form,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  visible
}: {
  categories: CategoryApi[];
  errors: {
    categoryType?: string;
    emoji?: string;
    name?: string;
  };
  error: string | null;
  form: CategoryFormState;
  isSaving: boolean;
  onChange: (form: CategoryFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  visible: boolean;
}) {
  const [iconSearch, setIconSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    categoryType: false,
    emoji: false,
    name: false
  });
  const selectedIcon = LEGACY_CATEGORY_ICONS.find((icon) => icon.emoji === form.emoji);
  const recentIcons = useMemo(() => {
    const seen = new Set<string>();

    return categories
      .map((category) => LEGACY_CATEGORY_ICONS.find((icon) => icon.emoji === category.emoji))
      .filter((icon): icon is (typeof LEGACY_CATEGORY_ICONS)[number] => {
        if (!icon || seen.has(icon.emoji)) {
          return false;
        }

        seen.add(icon.emoji);
        return true;
      })
      .slice(0, 6);
  }, [categories]);
  const iconOptions = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();

    if (!query) {
      return LEGACY_CATEGORY_ICONS;
    }

    return LEGACY_CATEGORY_ICONS.filter((icon) => icon.label.toLowerCase().includes(query) || icon.group.toLowerCase().includes(query));
  }, [iconSearch]);
  const iconGroups = useMemo(() => Array.from(new Set(iconOptions.map((icon) => icon.group))), [iconOptions]);
  const visibleErrors = {
    categoryType: submitted || touched.categoryType ? errors.categoryType : undefined,
    emoji: submitted || touched.emoji ? errors.emoji : undefined,
    name: submitted || touched.name ? errors.name : undefined
  };

  function changeName(name: string) {
    setTouched((current) => ({ ...current, name: true }));
    onChange({ ...form, name });
  }

  function changeCategoryType(categoryType: string) {
    setTouched((current) => ({ ...current, categoryType: true }));
    onChange({ ...form, categoryType });
  }

  function changeIcon(emoji: string) {
    setTouched((current) => ({ ...current, emoji: true }));
    onChange({ ...form, emoji });
  }

  function save() {
    setSubmitted(true);
    onSubmit();
  }

  return (
    <BottomSheet visible={visible} title={form.id ? "Edit Category" : "Add Category"} onClose={onClose}>
      <View className="gap-4">
        <FormField label="Category Name">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
            onChangeText={changeName}
            placeholder="Groceries"
            placeholderTextColor={theme.colors.text.muted}
            value={form.name}
          />
          <Text className="mt-1 text-right font-sans text-xs text-text-muted">{form.name.trim().length} / 30</Text>
          {visibleErrors.name ? <Text className="font-sans text-xs font-semibold text-accent-rose">{visibleErrors.name}</Text> : null}
        </FormField>
        <FormField label="Category Type">
          <CategoryTypeSelector {...(visibleErrors.categoryType ? { error: visibleErrors.categoryType } : {})} value={form.categoryType} onChange={changeCategoryType} />
        </FormField>
        <FormField label="Icon">
          <View className="gap-2">
            {form.emoji ? (
              <View className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background-muted p-3">
                <CategoryIcon emoji={form.emoji} size="sm" />
                <Text className="font-sans text-sm text-text">{selectedIcon?.label ?? "Selected icon"}</Text>
              </View>
            ) : null}
            <View className="h-11 flex-row items-center gap-2 rounded-lg border border-surface-border bg-background px-3">
              <MaterialCommunityIcons name="magnify" size={theme.icons.xs} color={theme.colors.text.muted} />
              <TextInput
                className="min-w-0 flex-1 font-sans text-sm text-text"
                onChangeText={setIconSearch}
                placeholder="Search icons"
                placeholderTextColor={theme.colors.text.muted}
                value={iconSearch}
              />
            </View>
            {!iconSearch.trim() && recentIcons.length > 0 ? (
              <View className="gap-2">
                <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Recent</Text>
                <View className="flex-row flex-wrap gap-2">
                  {recentIcons.map((icon) => (
                    <Pressable
                      key={`recent:${icon.label}:${icon.emoji}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${icon.label} icon`}
                      className={
                        form.emoji === icon.emoji
                          ? "h-11 w-11 items-center justify-center rounded-lg border border-brand bg-brand-deep"
                          : "h-11 w-11 items-center justify-center rounded-lg border border-surface-border bg-surface"
                      }
                      onPress={() => changeIcon(icon.emoji)}
                    >
                      <MaterialCommunityIcons name={icon.icon} size={theme.icons.sm} color={form.emoji === icon.emoji ? theme.colors.brand.soft : theme.colors.text.muted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            {iconGroups.map((group) => (
              <View key={group} className="gap-2">
                <Text className="font-sans text-xs font-semibold uppercase text-text-muted">{group}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {iconOptions
                    .filter((icon) => icon.group === group)
                    .map((icon) => (
                      <Pressable
                        key={`${icon.label}:${icon.emoji}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${icon.label} icon`}
                        className={
                          form.emoji === icon.emoji
                            ? "h-11 w-11 items-center justify-center rounded-lg border border-brand bg-brand-deep"
                            : "h-11 w-11 items-center justify-center rounded-lg border border-surface-border bg-surface"
                        }
                        onPress={() => changeIcon(icon.emoji)}
                      >
                        <MaterialCommunityIcons name={icon.icon} size={theme.icons.sm} color={form.emoji === icon.emoji ? theme.colors.brand.soft : theme.colors.text.muted} />
                      </Pressable>
                    ))}
                </View>
              </View>
            ))}
            {visibleErrors.emoji ? <Text className="font-sans text-xs font-semibold text-accent-rose">{visibleErrors.emoji}</Text> : null}
          </View>
        </FormField>
        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" disabled={isSaving} onPress={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton className="flex-1" disabled={isSaving} loading={isSaving} onPress={save}>
            {form.id ? "Save Changes" : "Add Category"}
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

function DeleteCategoryDialog({
  category,
  deleting,
  error,
  onCancel,
  onConfirm
}: {
  category: CategoryApi | null;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (category: CategoryApi) => void;
}) {
  const transactionCount = category?.transactionCount;
  const hasTransactions = typeof transactionCount === "number" && transactionCount > 0;

  return (
    <BottomSheet visible={Boolean(category)} title="Delete Category" onClose={onCancel}>
      {category ? (
        <View className="gap-4">
          <View className="flex-row items-center gap-3 rounded-lg border border-accent-rose/30 bg-accent-rose/10 p-3">
            <CategoryIcon category={category} size="sm" tone="danger" />
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
                {category.name}
              </Text>
              <Text className="font-sans text-sm text-text-muted">{categoryType(category)} category</Text>
            </View>
          </View>
          <Text className="font-sans text-sm text-text-muted">
            {hasTransactions ? `This category is used by ${transactionCount} transactions. The backend may block deletion until those transactions are moved.` : "Are you sure you want to archive this category?"}
          </Text>
          {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
          <View className="flex-row gap-3">
            <SecondaryButton className="flex-1" disabled={deleting} onPress={onCancel}>
              Cancel
            </SecondaryButton>
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-1 flex-row items-center justify-center rounded-md border border-accent-rose bg-accent-rose/10 px-5"
              disabled={deleting}
              onPress={() => onConfirm(category)}
            >
              <MaterialCommunityIcons name="delete-outline" size={theme.icons.sm} color={theme.colors.accent.rose} />
              <Text className="ml-2 font-sans text-base font-semibold text-accent-rose">{deleting ? "Deleting..." : "Delete"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

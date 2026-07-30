import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Share, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { CurrencyText, ErrorView, LoadingSkeleton, PrimaryButton } from "@/components/ui";
import { useCreateWishlistCategoryMutation, useCreateWishlistItemMutation, useDeleteWishlistCategoryMutation, useDeleteWishlistItemMutation, useReorderWishlistCategoriesMutation, useUpdateWishlistCategoryMutation, useUpdateWishlistItemMutation, useWishlistQuery } from "@/features/wishlist/api";
import { CategoryChip, WishlistItemCard, WishlistSummaryCard } from "@/features/wishlist/components/WishlistCards";
import { CategoryManagerSheet, SortSheet, WishlistDetailSheet, WishlistItemFormSheet, WishlistMenuSheet } from "@/features/wishlist/components/WishlistSheets";
import type { WishlistSortKey } from "@/features/wishlist/types";
import { categoryDeleteFallback, moveWishlistCategory } from "@/features/wishlist/utils/wishlistCategories";
import { wishlistItemsToCsv } from "@/features/wishlist/utils/wishlistCsv";
import { filterWishlistItems, sortWishlistItems } from "@/features/wishlist/utils/wishlistFilters";
import type { WishlistCategoryApi, WishlistItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

export function WishlistScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const wishlistQuery = useWishlistQuery(token, vaultId);
  const createItem = useCreateWishlistItemMutation(token, vaultId);
  const updateItem = useUpdateWishlistItemMutation(token, vaultId);
  const deleteItem = useDeleteWishlistItemMutation(token, vaultId);
  const createCategory = useCreateWishlistCategoryMutation(token, vaultId);
  const updateCategory = useUpdateWishlistCategoryMutation(token, vaultId);
  const deleteCategory = useDeleteWishlistCategoryMutation(token, vaultId);
  const reorderCategories = useReorderWishlistCategoriesMutation(token, vaultId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WishlistSortKey>("recent");
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItemApi | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItemApi | null>(null);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);

  const items = useMemo(() => wishlistQuery.data?.items ?? [], [wishlistQuery.data?.items]);
  const categories = useMemo(() => [...(wishlistQuery.data?.categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [wishlistQuery.data?.categories]);
  const hasItems = items.length > 0;
  const hasCategories = categories.length > 0;
  const formCategories = hasItems ? categories : [];
  const visibleItems = useMemo(() => sortWishlistItems(filterWishlistItems(items, categories, search, selectedCategoryId), sort), [categories, items, search, selectedCategoryId, sort]);
  const isSavingItem = createItem.isPending || updateItem.isPending;
  const isSavingCategory = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending || reorderCategories.isPending;

  function openAddForm() {
    setEditingItem(null);
    setFormVisible(true);
  }

  function openEditForm(item: WishlistItemApi) {
    setEditingItem(item);
    setDetailItem(null);
    setFormVisible(true);
  }

  function confirmDeleteItem(item: WishlistItemApi) {
    Alert.alert("Delete wishlist item?", `Delete ${item.name}?`, [
      { style: "cancel", text: "Cancel" },
      { style: "destructive", text: "Delete", onPress: () => deleteItem.mutate(item.id) }
    ]);
  }

  async function exportWishlist() {
    const csv = wishlistItemsToCsv(visibleItems);
    await Share.share({
      message: csv,
      title: "wishlist.csv"
    });
    setMenuVisible(false);
  }

  function confirmDeleteCategory(category: WishlistCategoryApi) {
    const fallback = categoryDeleteFallback(categories, category.id);
    Alert.alert("Delete category?", `${category.itemCount} item(s) will move to ${fallback}.`, [
      { style: "cancel", text: "Cancel" },
      { style: "destructive", text: "Delete", onPress: () => deleteCategory.mutate({ categoryId: category.id, fallback }) }
    ]);
  }

  function moveCategory(category: WishlistCategoryApi, direction: "down" | "up") {
    const moved = moveWishlistCategory(categories, category.id, direction);
    reorderCategories.mutate({ categories: moved.map((entry) => ({ id: entry.id, sortOrder: entry.sortOrder })) });
  }

  return (
    <Screen contentClassName="gap-5 px-4 pb-28 pt-4" onRefresh={() => wishlistQuery.refetch()} refreshing={wishlistQuery.isRefetching}>
      <View className="flex-row items-start justify-between gap-4">
        <Pressable accessibilityLabel="Back" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted" onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="heart-outline" size={theme.icons.lg} color={theme.colors.brand.soft} />
            <Text className="font-sans text-3xl font-bold text-brand-soft">Wishlist</Text>
          </View>
          <Text className="font-sans text-base text-text">Track the things you want and plan to make them yours.</Text>
        </View>
        <View className="flex-row gap-2">
          {hasItems ? <Pressable accessibilityLabel="Wishlist search" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted">
            <MaterialCommunityIcons name="magnify" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
          </Pressable> : null}
          <Pressable accessibilityLabel="Wishlist menu" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted" onPress={() => setMenuVisible(true)}>
            <MaterialCommunityIcons name="dots-horizontal" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
          </Pressable>
        </View>
      </View>

      {wishlistQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {wishlistQuery.isError ? <ErrorView message="Wishlist could not be loaded." onRetry={() => wishlistQuery.refetch()} /> : null}

      {wishlistQuery.data ? <>
        <View className="flex-row gap-3">
          <WishlistSummaryCard caption="items in wishlist" icon="shopping-outline" label="Total Items" tone="brand" value={String(wishlistQuery.data.summary.totalItems)} />
          <WishlistSummaryCard caption="across all items" icon="wallet-outline" label="Total Cost" tone="success" value={<CurrencyText value={wishlistQuery.data.summary.totalCost} currencyCode={currencyCode} locale={locale} className="text-xl font-bold text-state-success" />} />
        </View>

        {!hasItems ? <View className="items-center gap-4 rounded-2xl border border-surface-border bg-surface px-5 py-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/25">
            <MaterialCommunityIcons name="heart-plus-outline" size={theme.icons.lg} color={theme.colors.brand.soft} />
          </View>
          <View className="items-center gap-2">
            <Text className="text-center font-sans text-2xl font-bold text-text">Start your wishlist</Text>
            <Text className="text-center font-sans text-base text-text-muted">Add your first item and create the categories that make sense for you.</Text>
          </View>
          <PrimaryButton className="mt-2 h-14 w-full rounded-xl" icon="plus-circle-outline" onPress={openAddForm}>Add First Item</PrimaryButton>
        </View> : <>
          <View className="flex-row flex-wrap gap-2">
            <CategoryChip icon="view-grid-outline" label="All" selected={selectedCategoryId === "all"} onPress={() => setSelectedCategoryId("all")} />
            {categories.map((category) => <CategoryChip icon={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} key={category.id} label={category.name} selected={selectedCategoryId === category.id} onPress={() => setSelectedCategoryId(category.id)} />)}
          </View>

          <PrimaryButton className="h-14 rounded-xl" icon="plus-circle-outline" onPress={openAddForm}>Add Item</PrimaryButton>

          <View className="flex-row gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3">
              <MaterialCommunityIcons name="magnify" size={theme.icons.sm} color={theme.colors.text.muted} />
              <TextInput accessibilityLabel="Search wishlist items" className="h-12 min-w-0 flex-1 font-sans text-base text-text" onChangeText={setSearch} placeholder="Search wishlist items..." placeholderTextColor={theme.colors.text.muted} value={search} />
            </View>
            <Pressable accessibilityLabel="Sort wishlist" accessibilityRole="button" className="h-12 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-4" onPress={() => setSortVisible(true)}>
              <MaterialCommunityIcons name="sort-variant" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
              <Text className="font-sans text-sm font-semibold text-text">Sort</Text>
              <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
            </Pressable>
          </View>

          {visibleItems.length === 0 ? <View className="items-center gap-3 rounded-xl border border-surface-border bg-surface p-5"><MaterialCommunityIcons name="magnify" size={theme.icons.lg} color={theme.colors.brand.soft} /><Text className="font-sans text-lg font-bold text-text">No matching items</Text><Text className="text-center font-sans text-sm text-text-muted">Try a different search, sort, or category.</Text></View> : <View className="gap-3"><Text className="font-sans text-xl font-bold text-text">My Wishlist ({visibleItems.length})</Text>{visibleItems.map((item) => <WishlistItemCard currencyCode={currencyCode} item={item} key={item.id} locale={locale} onDelete={() => confirmDeleteItem(item)} onEdit={() => openEditForm(item)} onPress={() => setDetailItem(item)} />)}</View>}

          <View className="flex-row items-center gap-4 rounded-xl border border-surface-border bg-surface p-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand/25"><MaterialCommunityIcons name="creation" size={theme.icons.md} color={theme.colors.brand.soft} /></View>
            <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-base font-bold text-brand-soft">Add the things you love, stay inspired.</Text><Text className="font-sans text-sm text-text">Keep your wishlist organized and do not lose track of what matters.</Text></View>
          </View>
        </>}
      </> : null}

      <WishlistMenuSheet canManageCategories={hasItems && hasCategories} visible={menuVisible} onClose={() => setMenuVisible(false)} onExport={exportWishlist} onManageCategories={() => { setMenuVisible(false); setCategoryManagerVisible(true); }} />
      <SortSheet selected={sort} visible={sortVisible} onClose={() => setSortVisible(false)} onSelect={(next) => { setSort(next); setSortVisible(false); }} />
      <WishlistItemFormSheet categories={formCategories} editingItem={editingItem} saving={isSavingItem} visible={formVisible} onClose={() => setFormVisible(false)} onSubmit={(body, itemId) => { if (itemId) updateItem.mutate({ body, itemId }, { onSuccess: () => setFormVisible(false) }); else createItem.mutate(body, { onSuccess: () => setFormVisible(false) }); }} />
      <WishlistDetailSheet currencyCode={currencyCode} item={detailItem} locale={locale} onClose={() => setDetailItem(null)} onDelete={(item) => { setDetailItem(null); confirmDeleteItem(item); }} onEdit={openEditForm} />
      <CategoryManagerSheet categories={categories} saving={isSavingCategory} visible={categoryManagerVisible} onAdd={(body) => createCategory.mutate(body)} onClose={() => setCategoryManagerVisible(false)} onDelete={confirmDeleteCategory} onMove={moveCategory} onUpdate={(categoryId, body) => updateCategory.mutate({ body, categoryId })} />
    </Screen>
  );
}

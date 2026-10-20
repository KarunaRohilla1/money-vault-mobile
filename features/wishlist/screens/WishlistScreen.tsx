import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ErrorView, LoadingSkeleton, PrimaryButton } from "@/components/ui";
import {
  useCompleteWishlistItemMutation,
  useCreateWishlistCategoryMutation,
  useCreateWishlistItemMutation,
  useDeleteWishlistCategoryMutation,
  useDeleteWishlistItemMutation,
  useReopenWishlistItemMutation,
  useReorderWishlistCategoriesMutation,
  useUpdateWishlistCategoryMutation,
  useUpdateWishlistItemMutation,
  useWishlistQuery
} from "@/features/wishlist/api";
import { CategoryChip, WishlistCompactSummary, WishlistItemCard } from "@/features/wishlist/components/WishlistCards";
import {
  CategoryManagerSheet,
  MarkPurchasedSheet,
  SortSheet,
  WishlistDetailSheet,
  WishlistItemFormSheet,
  WishlistMenuSheet
} from "@/features/wishlist/components/WishlistSheets";
import type { WishlistSortKey, WishlistTab } from "@/features/wishlist/types";
import { categoryDeleteFallback, moveWishlistCategory } from "@/features/wishlist/utils/wishlistCategories";
import { wishlistItemsToCsv } from "@/features/wishlist/utils/wishlistCsv";
import { filterWishlistItems, isWishlistItemCompleted, sortWishlistItems } from "@/features/wishlist/utils/wishlistFilters";
import { showToast } from "@/lib/toast";
import { ApiClientError } from "@/services/api/client";
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
  const completeItem = useCompleteWishlistItemMutation(token, vaultId);
  const reopenItem = useReopenWishlistItemMutation(token, vaultId);
  const createCategory = useCreateWishlistCategoryMutation(token, vaultId);
  const updateCategory = useUpdateWishlistCategoryMutation(token, vaultId);
  const deleteCategory = useDeleteWishlistCategoryMutation(token, vaultId);
  const reorderCategories = useReorderWishlistCategoriesMutation(token, vaultId);

  const [tab, setTab] = useState<WishlistTab>("active");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WishlistSortKey>("recent");
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItemApi | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItemApi | null>(null);
  const [completingItem, setCompletingItem] = useState<WishlistItemApi | null>(null);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);

  const items = useMemo(() => wishlistQuery.data?.items ?? [], [wishlistQuery.data?.items]);
  const categories = useMemo(
    () => [...(wishlistQuery.data?.categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [wishlistQuery.data?.categories]
  );

  const activeItems = useMemo(() => items.filter((item) => !isWishlistItemCompleted(item)), [items]);
  const historyItems = useMemo(() => items.filter((item) => isWishlistItemCompleted(item)), [items]);

  const activeCost = useMemo(() => activeItems.reduce((acc, item) => acc + item.estimatedCost, 0), [activeItems]);
  const historySpent = useMemo(
    () => historyItems.reduce((acc, item) => acc + (item.purchasedAmount ?? item.estimatedCost), 0),
    [historyItems]
  );

  const hasAnyItems = items.length > 0;
  const hasCategories = categories.length > 0;
  const formCategories = hasAnyItems ? categories : [];

  const visibleItems = useMemo(
    () => sortWishlistItems(filterWishlistItems(items, categories, search, selectedCategoryId, tab), sort),
    [categories, items, search, selectedCategoryId, sort, tab]
  );

  const isSavingItem = createItem.isPending || updateItem.isPending;
  const isSavingCategory =
    createCategory.isPending || updateCategory.isPending || deleteCategory.isPending || reorderCategories.isPending;

  function openAddForm() {
    setEditingItem(null);
    setFormVisible(true);
  }

  function openEditForm(item: WishlistItemApi) {
    setEditingItem(item);
    setDetailItem(null);
    setFormVisible(true);
  }

  function openCompleteForm(item: WishlistItemApi) {
    setCompletingItem(item);
  }

  function handleConfirmPurchase(values: { purchasedAmount: number; purchasedDate: string }) {
    if (!completingItem) return;
    const itemToComplete = completingItem;
    completeItem.mutate(
      {
        body: {
          purchasedAmount: values.purchasedAmount,
          purchasedDate: values.purchasedDate
        },
        itemId: itemToComplete.id
      },
      {
        onError: (err) => {
          const message = err instanceof ApiClientError ? err.message : "Could not mark item as purchased.";
          showToast(message);
        },
        onSuccess: () => {
          setCompletingItem(null);
          setDetailItem(null);
          showToast(`${itemToComplete.name} marked as purchased!`);
        }
      }
    );
  }

  function handleReopenItem(item: WishlistItemApi) {
    Alert.alert("Move back to Active?", `Restore ${item.name} to your active wishlist?`, [
      { style: "cancel", text: "Cancel" },
      {
        text: "Move to Active",
        onPress: () => {
          reopenItem.mutate(item.id, {
            onError: (err) => {
              const message = err instanceof ApiClientError ? err.message : "Could not restore item.";
              showToast(message);
            },
            onSuccess: () => {
              setDetailItem(null);
              showToast(`${item.name} moved back to active.`);
            }
          });
        }
      }
    ]);
  }

  function confirmDeleteItem(item: WishlistItemApi) {
    const isCompleted = isWishlistItemCompleted(item);
    Alert.alert(
      isCompleted ? "Delete from History?" : "Delete wishlist item?",
      `Delete ${item.name}?`,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: () => {
            deleteItem.mutate(item.id, {
              onError: () => showToast("Could not delete item."),
              onSuccess: () => {
                setDetailItem(null);
                showToast(`${item.name} deleted.`);
              }
            });
          }
        }
      ]
    );
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
      {
        style: "destructive",
        text: "Delete",
        onPress: () => deleteCategory.mutate({ categoryId: category.id, fallback })
      }
    ]);
  }

  function moveCategory(category: WishlistCategoryApi, direction: "down" | "up") {
    const moved = moveWishlistCategory(categories, category.id, direction);
    reorderCategories.mutate({ categories: moved.map((entry) => ({ id: entry.id, sortOrder: entry.sortOrder })) });
  }

  return (
    <Screen
      contentClassName="gap-3.5 px-4 pb-28 pt-2"
      onRefresh={() => wishlistQuery.refetch()}
      refreshing={wishlistQuery.isRefetching}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            className="h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-border bg-background-muted active:bg-surface"
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.text.DEFAULT} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="heart-outline" size={18} color={theme.colors.brand.soft} />
              <Text className="font-sans text-xl font-bold text-brand-soft" numberOfLines={1}>
                Wishlist
              </Text>
            </View>
            <Text className="font-sans text-[11px] text-text-muted" numberOfLines={1} ellipsizeMode="tail">
              Track and plan the things you want
            </Text>
          </View>
        </View>

        <View className="shrink-0 flex-row items-center gap-1.5">
          {hasAnyItems && tab === "active" ? (
            <Pressable
              accessibilityLabel="Add Wishlist Item"
              accessibilityRole="button"
              className="h-9 flex-row items-center gap-1 rounded-full bg-brand px-2.5 active:opacity-80"
              onPress={openAddForm}
            >
              <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text.DEFAULT} />
              <Text className="font-sans text-xs font-bold text-text">Add Item</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel="Wishlist menu"
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-background-muted active:bg-surface"
            onPress={() => setMenuVisible(true)}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={18} color={theme.colors.text.DEFAULT} />
          </Pressable>
        </View>
      </View>

      {wishlistQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {wishlistQuery.isError ? (
        <ErrorView message="Wishlist could not be loaded." onRetry={() => wishlistQuery.refetch()} />
      ) : null}

      {wishlistQuery.data ? (
        <>
          {/* Compact summary row */}
          <WishlistCompactSummary
            activeCost={activeCost}
            activeCount={activeItems.length}
            currencyCode={currencyCode}
            historyCount={historyItems.length}
            historySpent={historySpent}
            locale={locale}
            tab={tab}
          />

          {!hasAnyItems ? (
            <View className="items-center gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-6">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand/25">
                <MaterialCommunityIcons name="heart-plus-outline" size={theme.icons.md} color={theme.colors.brand.soft} />
              </View>
              <View className="items-center gap-1">
                <Text className="text-center font-sans text-lg font-bold text-text">Start your wishlist</Text>
                <Text className="text-center font-sans text-xs text-text-muted">
                  Add your first item and create the categories that make sense for you.
                </Text>
              </View>
              <PrimaryButton className="mt-1 h-10 w-full rounded-xl" icon="plus-circle-outline" onPress={openAddForm}>
                Add First Item
              </PrimaryButton>
            </View>
          ) : (
            <>
              {/* Active vs History Segmented Tab Switcher */}
              <View className="flex-row rounded-xl border border-surface-border bg-surface p-1">
                <Pressable
                  accessibilityLabel="Active wishlist items"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "active" }}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-1.5 ${tab === "active" ? "bg-brand" : "bg-transparent"}`}
                  onPress={() => setTab("active")}
                >
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={16}
                    color={tab === "active" ? theme.colors.text.DEFAULT : theme.colors.text.muted}
                  />
                  <Text className={`font-sans text-xs font-bold ${tab === "active" ? "text-text" : "text-text-muted"}`}>
                    Active ({activeItems.length})
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Wishlist purchase history"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "history" }}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-1.5 ${tab === "history" ? "bg-brand" : "bg-transparent"}`}
                  onPress={() => setTab("history")}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color={tab === "history" ? theme.colors.text.DEFAULT : theme.colors.text.muted}
                  />
                  <Text className={`font-sans text-xs font-bold ${tab === "history" ? "text-text" : "text-text-muted"}`}>
                    History ({historyItems.length})
                  </Text>
                </Pressable>
              </View>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-1.5 py-0.5"
              >
                <CategoryChip
                  icon="view-grid-outline"
                  label="All"
                  selected={selectedCategoryId === "all"}
                  onPress={() => setSelectedCategoryId("all")}
                />
                {categories.map((category) => (
                  <CategoryChip
                    icon={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    key={category.id}
                    label={category.name}
                    selected={selectedCategoryId === category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                  />
                ))}
              </ScrollView>

              {/* Compact Search and Sort Row */}
              <View className="flex-row items-center gap-2">
                <View className="h-9 min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3">
                  <MaterialCommunityIcons name="magnify" size={theme.icons.xs} color={theme.colors.text.muted} />
                  <TextInput
                    accessibilityLabel="Search wishlist items"
                    className="h-9 min-w-0 flex-1 font-sans text-xs text-text py-0"
                    onChangeText={setSearch}
                    placeholder={`Search ${tab === "active" ? "active" : "purchased"} items...`}
                    placeholderTextColor={theme.colors.text.muted}
                    value={search}
                  />
                  {search ? (
                    <Pressable accessibilityLabel="Clear search" onPress={() => setSearch("")} hitSlop={8}>
                      <MaterialCommunityIcons name="close-circle" size={14} color={theme.colors.text.muted} />
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Sort wishlist"
                  accessibilityRole="button"
                  className="h-9 flex-row items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 active:bg-background-muted"
                  onPress={() => setSortVisible(true)}
                >
                  <MaterialCommunityIcons name="sort-variant" size={theme.icons.xs} color={theme.colors.text.DEFAULT} />
                  <Text className="font-sans text-xs font-semibold text-text">Sort</Text>
                  <MaterialCommunityIcons name="chevron-down" size={theme.icons.xs} color={theme.colors.text.muted} />
                </Pressable>
              </View>

              {/* Items List or Empty State */}
              {visibleItems.length === 0 ? (
                <View className="items-center gap-2.5 rounded-xl border border-surface-border bg-surface p-4">
                  <MaterialCommunityIcons
                    name={tab === "active" ? "heart-broken-outline" : "history"}
                    size={theme.icons.md}
                    color={theme.colors.brand.soft}
                  />
                  <Text className="font-sans text-base font-bold text-text">
                    {tab === "active"
                      ? activeItems.length === 0
                        ? "All caught up!"
                        : "No matching active items"
                      : historyItems.length === 0
                        ? "No purchased items yet"
                        : "No matching items in history"}
                  </Text>
                  <Text className="text-center font-sans text-xs text-text-muted">
                    {tab === "active"
                      ? activeItems.length === 0
                        ? "You have marked all wishlist items as purchased or haven't added any yet."
                        : "Try a different search, sort, or category."
                      : historyItems.length === 0
                        ? "When you purchase an item from your wishlist, mark it as completed to view it here."
                        : "Try a different search, sort, or category."}
                  </Text>
                  {tab === "active" && activeItems.length === 0 ? (
                    <PrimaryButton className="mt-1 h-10 w-full rounded-xl" icon="plus-circle-outline" onPress={openAddForm}>
                      Add New Item
                    </PrimaryButton>
                  ) : null}
                </View>
              ) : (
                <View className="gap-2.5">
                  <Text className="font-sans text-base font-bold text-text">
                    {tab === "active" ? "Pending Items" : "Purchase History"} ({visibleItems.length})
                  </Text>
                  {visibleItems.map((item) => (
                    <WishlistItemCard
                      currencyCode={currencyCode}
                      item={item}
                      key={item.id}
                      locale={locale}
                      onComplete={tab === "active" ? openCompleteForm : undefined}
                      onDelete={() => confirmDeleteItem(item)}
                      onEdit={() => openEditForm(item)}
                      onPress={() => setDetailItem(item)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </>
      ) : null}

      <WishlistMenuSheet
        canManageCategories={hasAnyItems && hasCategories}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onExport={exportWishlist}
        onManageCategories={() => {
          setMenuVisible(false);
          setCategoryManagerVisible(true);
        }}
      />
      <SortSheet
        selected={sort}
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        onSelect={(next) => {
          setSort(next);
          setSortVisible(false);
        }}
      />
      <WishlistItemFormSheet
        categories={formCategories}
        editingItem={editingItem}
        saving={isSavingItem}
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={(body, itemId) => {
          if (itemId) {
            updateItem.mutate({ body, itemId }, { onSuccess: () => setFormVisible(false) });
          } else {
            createItem.mutate(body, { onSuccess: () => setFormVisible(false) });
          }
        }}
      />
      <WishlistDetailSheet
        currencyCode={currencyCode}
        item={detailItem}
        locale={locale}
        onClose={() => setDetailItem(null)}
        onComplete={(item) => {
          setDetailItem(null);
          openCompleteForm(item);
        }}
        onDelete={(item) => {
          confirmDeleteItem(item);
        }}
        onEdit={openEditForm}
        onReopen={handleReopenItem}
      />
      <MarkPurchasedSheet
        currencyCode={currencyCode}
        item={completingItem}
        locale={locale}
        saving={completeItem.isPending}
        visible={Boolean(completingItem)}
        onClose={() => setCompletingItem(null)}
        onConfirm={handleConfirmPurchase}
      />
      <CategoryManagerSheet
        categories={categories}
        saving={isSavingCategory}
        visible={categoryManagerVisible}
        onAdd={(body) => createCategory.mutate(body)}
        onClose={() => setCategoryManagerVisible(false)}
        onDelete={confirmDeleteCategory}
        onMove={moveCategory}
        onUpdate={(categoryId, body) => updateCategory.mutate({ body, categoryId })}
      />
    </Screen>
  );
}

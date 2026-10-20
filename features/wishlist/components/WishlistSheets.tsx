import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Linking, Pressable, Text, TextInput, View } from "react-native";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";

import { BottomSheet, CurrencyText, PrimaryButton, SecondaryButton } from "@/components/ui";
import { PriorityBadge, PurchaseBadge, formatWishlistDate } from "@/features/wishlist/components/WishlistCards";
import { pickWishlistGalleryImage } from "@/features/wishlist/services/imagePicker.service";
import type { WishlistCategoryFormValues, WishlistItemFormValues, WishlistSortKey } from "@/features/wishlist/types";
import { isWishlistItemCompleted } from "@/features/wishlist/utils/wishlistFilters";
import { formatWishlistMoneyInput, parseWishlistMoney } from "@/features/wishlist/utils/wishlistMoney";
import { completeWishlistItemSchema, wishlistCategorySchema, wishlistItemSchema } from "@/features/wishlist/validation/wishlistSchemas";
import type { WishlistCategoryApi, WishlistImageSourceApi, WishlistItemApi, WishlistPriorityApi } from "@/services/api/types";
import { theme } from "@/theme";

const priorityOptions: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: WishlistPriorityApi }[] = [
  { icon: "fire", label: "High", value: "HIGH" },
  { icon: "star-outline", label: "Medium", value: "MEDIUM" },
  { icon: "flag-outline", label: "Low", value: "LOW" }
];

const sortOptions: { label: string; value: WishlistSortKey }[] = [
  { label: "Recently Added", value: "recent" },
  { label: "Priority", value: "priority" },
  { label: "Cost High -> Low", value: "cost_desc" },
  { label: "Cost Low -> High", value: "cost_asc" },
  { label: "Alphabetical", value: "alpha" }
];

const categoryPalette = ["purple", "blue", "green", "gold", "pink", "teal"];
const categoryIcons: (keyof typeof MaterialCommunityIcons.glyphMap)[] = ["monitor", "airplane", "book-open-page-variant-outline", "home-outline", "gamepad-variant-outline", "tshirt-crew-outline", "tag-outline"];
const emptyItemForm: WishlistItemFormValues = { categoryId: null, categoryName: "", estimatedCost: "", imageSource: null, imageUrl: "", name: "", notes: "", priority: "HIGH", purchaseLink: "" };
const emptyCategoryForm: WishlistCategoryFormValues = { color: "purple", icon: "tag-outline", id: null, name: "" };

export function WishlistMenuSheet({ canManageCategories, visible, onClose, onExport, onManageCategories }: { canManageCategories: boolean; visible: boolean; onClose: () => void; onExport: () => void; onManageCategories: () => void }) {
  return <BottomSheet visible={visible} title="Wishlist" onClose={onClose}><View className="gap-2">{canManageCategories ? <MenuRow icon="folder-cog-outline" label="Manage Categories" onPress={onManageCategories} /> : null}<MenuRow icon="file-export-outline" label="Export Wishlist" onPress={onExport} /></View></BottomSheet>;
}

export function SortSheet({ selected, visible, onClose, onSelect }: { selected: WishlistSortKey; visible: boolean; onClose: () => void; onSelect: (sort: WishlistSortKey) => void }) {
  return <BottomSheet visible={visible} title="Sort Wishlist" onClose={onClose}><View className="gap-2">{sortOptions.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected === option.value }} className={`min-h-12 flex-row items-center justify-between rounded-xl px-4 py-3 ${selected === option.value ? "bg-brand" : "bg-surface"}`} key={option.value} onPress={() => onSelect(option.value)}><Text className="font-sans text-sm font-semibold text-text">{option.label}</Text>{selected === option.value ? <MaterialCommunityIcons name="check" size={theme.icons.sm} color={theme.colors.text.DEFAULT} /> : null}</Pressable>)}</View></BottomSheet>;
}

export function WishlistDetailSheet({
  currencyCode,
  item,
  locale,
  onClose,
  onComplete,
  onDelete,
  onEdit,
  onReopen
}: {
  currencyCode: string;
  item: WishlistItemApi | null;
  locale: string;
  onClose: () => void;
  onComplete?: ((item: WishlistItemApi) => void) | undefined;
  onDelete: (item: WishlistItemApi) => void;
  onEdit: (item: WishlistItemApi) => void;
  onReopen?: ((item: WishlistItemApi) => void) | undefined;
}) {
  if (!item) return null;
  const isCompleted = isWishlistItemCompleted(item);
  const paidAmount = item.purchasedAmount ?? item.estimatedCost;
  const diff = item.estimatedCost - paidAmount;

  return (
    <BottomSheet visible={Boolean(item)} title={item.name} presentation="fullScreen" onClose={onClose}>
      <View className="gap-4">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="h-64 rounded-xl bg-surface" resizeMode="cover" />
        ) : (
          <View className="h-44 items-center justify-center rounded-xl bg-surface border border-surface-border">
            <MaterialCommunityIcons
              name={isCompleted ? "check-circle-outline" : "image-outline"}
              size={theme.icons.lg}
              color={isCompleted ? theme.colors.state.success : theme.colors.brand.soft}
            />
          </View>
        )}

        <View className="gap-2">
          {isCompleted ? <PurchaseBadge date={item.purchasedDate} /> : <PriorityBadge priority={item.priority} />}
          <Text className="font-sans text-2xl font-bold text-text">{item.name}</Text>
          <Text className="font-sans text-sm text-text-muted">{item.category}</Text>
        </View>

        {isCompleted ? (
          <View className="gap-2.5 rounded-xl border border-state-success/40 bg-state-success/10 p-4">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="check-decagram" size={theme.icons.sm} color={theme.colors.state.success} />
              <Text className="font-sans text-sm font-bold text-state-success">Purchased</Text>
            </View>
            <View className="flex-row items-baseline justify-between">
              <Text className="font-sans text-sm text-text-muted">Actual Paid</Text>
              <CurrencyText value={paidAmount} currencyCode={currencyCode} locale={locale} className="text-xl font-bold text-state-success" />
            </View>
            <View className="flex-row items-baseline justify-between border-t border-state-success/20 pt-2">
              <Text className="font-sans text-xs text-text-muted">Target Amount</Text>
              <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold text-text-muted" />
            </View>
            {diff !== 0 ? (
              <View className="flex-row items-baseline justify-between">
                <Text className="font-sans text-xs text-text-muted">Target vs Paid</Text>
                <Text className={`font-sans text-xs font-bold ${diff > 0 ? "text-state-success" : "text-accent-rose"}`}>
                  {diff > 0 ? "Saved " : "Over by "}
                  <CurrencyText value={Math.abs(diff)} currencyCode={currencyCode} locale={locale} className={`text-xs font-bold ${diff > 0 ? "text-state-success" : "text-accent-rose"}`} />
                </Text>
              </View>
            ) : null}
            <Text className="mt-1 font-sans text-xs text-text-muted">
              Purchased {formatWishlistDate(item.purchasedDate)}
            </Text>
          </View>
        ) : (
          <View className="gap-1 rounded-xl border border-surface-border bg-surface p-4">
            <Text className="font-sans text-xs text-text-muted">Target Amount</Text>
            <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-2xl font-bold text-text" />
          </View>
        )}

        {item.purchaseLink ? (
          <PrimaryButton icon="open-in-new" onPress={() => Linking.openURL(item.purchaseLink)}>
            Open Purchase Link
          </PrimaryButton>
        ) : null}

        {item.notes ? (
          <View className="rounded-xl border border-surface-border bg-surface p-4">
            <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Notes</Text>
            <Text className="mt-2 font-sans text-sm text-text">{item.notes}</Text>
          </View>
        ) : null}

        <Text className="font-sans text-xs text-text-muted">
          Added {formatWishlistDate(item.createdAt)}
        </Text>

        {!isCompleted && onComplete ? (
          <PrimaryButton
            icon="check-circle-outline"
            onPress={() => onComplete(item)}
            className="h-13 rounded-xl bg-state-success"
          >
            Mark as Purchased
          </PrimaryButton>
        ) : null}

        {isCompleted && onReopen ? (
          <SecondaryButton
            icon="undo-variant"
            onPress={() => onReopen(item)}
            className="h-12 rounded-xl"
          >
            Move back to Active
          </SecondaryButton>
        ) : null}

        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" icon="pencil-outline" onPress={() => onEdit(item)}>
            Edit
          </SecondaryButton>
          <SecondaryButton className="flex-1" icon="trash-can-outline" onPress={() => onDelete(item)}>
            Delete
          </SecondaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

export function MarkPurchasedSheet({
  currencyCode,
  item,
  locale,
  saving,
  visible,
  onClose,
  onConfirm
}: {
  currencyCode: string;
  item: WishlistItemApi | null;
  locale: string;
  saving: boolean;
  visible: boolean;
  onClose: () => void;
  onConfirm: (values: { purchasedAmount: number; purchasedDate: string }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible || !item) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount(formatWishlistMoneyInput(String(item.estimatedCost)));
    setDate(new Date().toISOString().slice(0, 10));
    setSubmitted(false);
  }, [item, visible]);

  if (!item) return null;

  const parsed = completeWishlistItemSchema.safeParse({
    purchasedAmount: amount,
    purchasedDate: date
  });
  const errors = submitted && !parsed.success ? parsed.error.flatten().fieldErrors : {};
  const enteredNumber = parseWishlistMoney(amount);
  const diff = Number.isFinite(enteredNumber) ? item.estimatedCost - enteredNumber : 0;

  function handleSubmit() {
    setSubmitted(true);
    const result = completeWishlistItemSchema.safeParse({
      purchasedAmount: amount,
      purchasedDate: date
    });
    if (!result.success) return;
    onConfirm({
      purchasedAmount: parseWishlistMoney(result.data.purchasedAmount),
      purchasedDate: result.data.purchasedDate.trim()
    });
  }

  return (
    <BottomSheet visible={visible} title="Mark as Purchased" onClose={onClose}>
      <View className="gap-4">
        <View className="gap-1">
          <Text className="font-sans text-base font-bold text-text">{item.name}</Text>
          <Text className="font-sans text-xs text-text-muted">{item.category}</Text>
        </View>

        <View className="flex-row items-center justify-between rounded-xl border border-surface-border bg-surface p-3.5">
          <Text className="font-sans text-sm text-text-muted">Target Amount</Text>
          <CurrencyText value={item.estimatedCost} currencyCode={currencyCode} locale={locale} className="text-base font-bold text-text" />
        </View>

        <Field label="Actual Purchase Amount *" error={errors.purchasedAmount?.[0]} icon="currency-inr">
          <TextInput
            className="h-12 flex-1 font-sans text-base text-text"
            inputMode="decimal"
            keyboardType="decimal-pad"
            onChangeText={(value) => setAmount(formatWishlistMoneyInput(value))}
            placeholder="e.g. 19500"
            placeholderTextColor={theme.colors.text.muted}
            value={amount}
          />
        </Field>

        {Number.isFinite(enteredNumber) && enteredNumber > 0 && diff !== 0 ? (
          <View className={`rounded-xl border p-3 ${diff > 0 ? "border-state-success/30 bg-state-success/10" : "border-accent-rose/30 bg-accent-rose/10"}`}>
            <Text className={`font-sans text-xs font-semibold ${diff > 0 ? "text-state-success" : "text-accent-rose"}`}>
              {diff > 0
                ? `You saved ${formatWishlistMoneyInput(String(diff))} compared to your target!`
                : `Actual cost is ${formatWishlistMoneyInput(String(Math.abs(diff)))} higher than target.`}
            </Text>
          </View>
        ) : null}

        <Field label="Purchase Date (YYYY-MM-DD) *" error={errors.purchasedDate?.[0]} icon="calendar">
          <TextInput
            className="h-12 flex-1 font-sans text-base text-text"
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.text.muted}
            value={date}
          />
        </Field>

        <View className="gap-2 pt-2">
          <PrimaryButton
            className="h-14 rounded-xl bg-state-success"
            disabled={saving}
            loading={saving}
            icon="check-circle-outline"
            onPress={handleSubmit}
          >
            Confirm Purchase
          </PrimaryButton>
          <SecondaryButton disabled={saving} onPress={onClose}>
            Cancel
          </SecondaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

export function WishlistItemFormSheet({ categories, editingItem, saving, visible, onClose, onSubmit }: { categories: WishlistCategoryApi[]; editingItem: WishlistItemApi | null; saving: boolean; visible: boolean; onClose: () => void; onSubmit: (body: { category: string; categoryId?: number | null; estimatedCost: number; imageSource?: WishlistImageSourceApi | null; imageUrl?: string; name: string; notes?: string; priority: WishlistPriorityApi; purchaseLink?: string }, itemId?: number) => void }) {
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [imageUrlVisible, setImageUrlVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { handleSubmit, reset, setValue, watch } = useForm<WishlistItemFormValues>({ defaultValues: emptyItemForm });
  // React Hook Form's watch API intentionally subscribes this sheet to local form values.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const selectedCategory = categories.find((category) => category.id === values.categoryId) ?? null;
  const parsed = wishlistItemSchema.safeParse(values);
  const errors = submitted && !parsed.success ? parsed.error.flatten().fieldErrors : {};

  useEffect(() => {
    if (!visible) return;
    if (editingItem) {
      const category = categories.find((entry) => entry.id === editingItem.categoryId || entry.name === editingItem.category);
      reset({ categoryId: category?.id ?? null, categoryName: category ? "" : editingItem.category, estimatedCost: formatWishlistMoneyInput(String(editingItem.estimatedCost)), imageSource: editingItem.imageSource ?? (editingItem.imageUrl ? "url" : null), imageUrl: editingItem.imageUrl ?? "", name: editingItem.name, notes: editingItem.notes ?? "", priority: editingItem.priority, purchaseLink: editingItem.purchaseLink ?? "" });
    } else {
      reset({ ...emptyItemForm, categoryId: categories[0]?.id ?? null });
    }
    setSubmitted(false);
  }, [categories, editingItem, reset, visible]);

  function submit(values: WishlistItemFormValues) {
    setSubmitted(true);
    const result = wishlistItemSchema.safeParse(values);
    if (!result.success) return;
    const category = categories.find((entry) => entry.id === result.data.categoryId);
    const categoryName = category?.name ?? result.data.categoryName.trim();
    if (!categoryName) return;
    onSubmit({ category: categoryName, categoryId: category?.id ?? null, estimatedCost: parseWishlistMoney(result.data.estimatedCost), imageSource: result.data.imageSource, imageUrl: result.data.imageUrl.trim(), name: result.data.name.trim(), notes: result.data.notes.trim(), priority: result.data.priority, purchaseLink: result.data.purchaseLink.trim() }, editingItem?.id);
  }

  async function handlePickImageFromGallery() {
    const result = await pickWishlistGalleryImage();
    if (result.status === "success") {
      setValue("imageUrl", result.uri);
      setValue("imageSource", "gallery");
    }
  }

  return <BottomSheet visible={visible} title={editingItem ? "Edit Item" : "Add Item"} presentation="fullScreen" onClose={onClose}><View className="gap-4"><Text className="font-sans text-sm text-text">Add the things you want to buy or plan for.</Text><View className="gap-3 rounded-xl border border-surface-border bg-surface p-4"><Text className="font-sans text-base font-semibold text-text">Product Image <Text className="text-text-muted">(optional)</Text></Text><View className="flex-row gap-3"><Pressable accessibilityRole="button" className="h-36 w-36 items-center justify-center rounded-xl border border-dashed border-brand-soft bg-background-muted" onPress={() => setImageUrlVisible(true)}>{values.imageUrl ? <Image source={{ uri: values.imageUrl }} className="h-full w-full rounded-xl" resizeMode="cover" /> : <><MaterialCommunityIcons name="image-outline" size={theme.icons.lg} color={theme.colors.brand.soft} /><Text className="font-sans text-sm font-semibold text-brand-soft">No Image</Text><Text className="font-sans text-xs text-text-muted">Tap to add</Text></>}</Pressable><View className="min-w-0 flex-1 gap-2"><ImageAction label="Choose from Gallery" sublabel="Select from your photos" icon="image-outline" onPress={() => void handlePickImageFromGallery()} /><ImageAction label="Image URL" sublabel="Paste an image link" icon="link-variant" onPress={() => setImageUrlVisible(true)} /><Text className="font-sans text-xs text-text-muted">JPG, PNG up to 5MB</Text></View></View></View><Field label="Item Name *" error={errors.name?.[0]} icon="tag-outline"><TextInput className="h-12 flex-1 font-sans text-base text-text" onChangeText={(name) => setValue("name", name)} placeholder={'e.g. MacBook Pro 14"'} placeholderTextColor={theme.colors.text.muted} value={values.name} /></Field>{categories.length > 0 ? <PickerField label="Category *" value={selectedCategory?.name ?? "Select category"} icon="folder-outline" error={errors.categoryName?.[0] ?? errors.categoryId?.[0]} onPress={() => setCategoryPickerVisible(true)} /> : <Field label="Category *" error={errors.categoryName?.[0]} icon="folder-outline"><TextInput className="h-12 flex-1 font-sans text-base text-text" onChangeText={(categoryName) => setValue("categoryName", categoryName)} placeholder="Create a category" placeholderTextColor={theme.colors.text.muted} value={values.categoryName} /></Field>}<View className="gap-3 rounded-xl border border-surface-border bg-surface p-4"><Text className="font-sans text-base font-semibold text-text">Priority *</Text><View className="flex-row gap-3">{priorityOptions.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: values.priority === option.value }} className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border ${values.priority === option.value ? prioritySelectedClass(option.value) : "border-surface-border bg-background-muted"}`} key={option.value} onPress={() => setValue("priority", option.value)}><MaterialCommunityIcons name={option.icon} size={theme.icons.sm} color={priorityColor(option.value)} /><Text className="font-sans text-sm font-semibold text-text">{option.label}</Text></Pressable>)}</View></View><Field label="Estimated Cost *" error={errors.estimatedCost?.[0]} icon="currency-inr"><TextInput className="h-12 flex-1 font-sans text-base text-text" inputMode="decimal" keyboardType="decimal-pad" onChangeText={(value) => setValue("estimatedCost", formatWishlistMoneyInput(value))} placeholder="e.g. 200000" placeholderTextColor={theme.colors.text.muted} value={values.estimatedCost} /></Field><Field label="Purchase Link" error={errors.purchaseLink?.[0]} icon="link-variant"><TextInput autoCapitalize="none" className="h-12 flex-1 font-sans text-base text-text" onChangeText={(purchaseLink) => setValue("purchaseLink", purchaseLink)} placeholder="https://..." placeholderTextColor={theme.colors.text.muted} value={values.purchaseLink} /></Field><View className="gap-3 rounded-xl border border-surface-border bg-surface p-4"><Text className="font-sans text-base font-semibold text-text">Notes <Text className="text-text-muted">(optional)</Text></Text><TextInput className="min-h-28 rounded-xl border border-surface-border bg-background-muted px-4 py-3 font-sans text-base text-text" maxLength={300} multiline onChangeText={(notes) => setValue("notes", notes)} placeholder="Add any notes about this item..." placeholderTextColor={theme.colors.text.muted} textAlignVertical="top" value={values.notes} /><Text className="self-end font-sans text-xs text-text-muted">{values.notes.length}/300</Text></View><PrimaryButton className="h-14 rounded-xl" disabled={saving} loading={saving} icon="plus-circle-outline" onPress={handleSubmit(submit)}>{editingItem ? "Save Item" : "Add Item"}</PrimaryButton></View><CategoryPickerSheet categories={categories} selectedId={values.categoryId} visible={categoryPickerVisible} onClose={() => setCategoryPickerVisible(false)} onSelect={(category) => { setValue("categoryId", category.id); setValue("categoryName", ""); setCategoryPickerVisible(false); }} /><ImageUrlSheet value={values.imageUrl} visible={imageUrlVisible} onClose={() => setImageUrlVisible(false)} onRemove={() => { setValue("imageUrl", ""); setValue("imageSource", null); setImageUrlVisible(false); }} onUse={(url) => { setValue("imageUrl", url); setValue("imageSource", "url"); setImageUrlVisible(false); }} /></BottomSheet>;
}

export function CategoryManagerSheet({ categories, visible, saving, onAdd, onClose, onDelete, onMove, onUpdate }: { categories: WishlistCategoryApi[]; visible: boolean; saving: boolean; onAdd: (body: { color: string; icon: string; name: string; sortOrder: number }) => void; onClose: () => void; onDelete: (category: WishlistCategoryApi) => void; onMove: (category: WishlistCategoryApi, direction: "down" | "up") => void; onUpdate: (categoryId: number, body: { color: string; icon: string; name: string; sortOrder: number }) => void }) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<WishlistCategoryFormValues>(emptyCategoryForm);
  const [formVisible, setFormVisible] = useState(false);
  const rows = useMemo(() => categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase())), [categories, search]);
  function submitCategory() { const result = wishlistCategorySchema.safeParse(form); if (!result.success) return; const sortOrder = form.id ? categories.find((category) => category.id === form.id)?.sortOrder ?? 0 : categories.length; if (form.id) onUpdate(form.id, { color: result.data.color, icon: result.data.icon, name: result.data.name.trim(), sortOrder }); else onAdd({ color: result.data.color, icon: result.data.icon, name: result.data.name.trim(), sortOrder }); setFormVisible(false); }
  return <BottomSheet visible={visible} title="Manage Categories" presentation="fullScreen" onClose={onClose}><View className="gap-4"><Text className="font-sans text-base text-text-muted">Organize your wishlist categories</Text><View className="h-12 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3"><MaterialCommunityIcons name="magnify" size={theme.icons.sm} color={theme.colors.text.muted} /><TextInput className="flex-1 font-sans text-base text-text" onChangeText={setSearch} placeholder="Search categories..." placeholderTextColor={theme.colors.text.muted} value={search} /></View>{rows.map((category) => <View className="flex-row items-center gap-3 rounded-xl bg-surface p-3" key={category.id}><View className={`h-14 w-14 items-center justify-center rounded-full ${categoryBgClass(category.color)}`}><MaterialCommunityIcons name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.md} color={theme.colors.text.DEFAULT} /></View><View className="min-w-0 flex-1"><Text className="font-sans text-lg font-semibold text-text">{category.name}</Text><Text className="font-sans text-sm text-text-muted">{category.itemCount} {category.itemCount === 1 ? "item" : "items"}</Text></View><IconButton icon="pencil-outline" label={`Edit ${category.name}`} onPress={() => { setForm({ color: category.color, icon: category.icon, id: category.id, name: category.name }); setFormVisible(true); }} /><IconButton icon="trash-can-outline" label={`Delete ${category.name}`} tone="danger" onPress={() => onDelete(category)} /><View className="gap-1"><IconButton icon="chevron-up" label={`Move ${category.name} up`} onPress={() => onMove(category, "up")} /><IconButton icon="chevron-down" label={`Move ${category.name} down`} onPress={() => onMove(category, "down")} /></View></View>)}<Pressable accessibilityRole="button" className="h-16 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-brand-soft" onPress={() => { setForm(emptyCategoryForm); setFormVisible(true); }}><MaterialCommunityIcons name="plus-circle-outline" size={theme.icons.md} color={theme.colors.brand.soft} /><Text className="font-sans text-lg font-bold text-brand-soft">Add New Category</Text></Pressable><View className="rounded-xl bg-surface p-4"><Text className="font-sans text-base font-bold text-brand-soft">Reorder Categories</Text><Text className="mt-1 font-sans text-sm text-text-muted">Use the arrow controls to change the order. This order is reflected in your category chips.</Text></View><PrimaryButton className="h-14" onPress={onClose}>Done</PrimaryButton></View><BottomSheet visible={formVisible} title={form.id ? "Edit Category" : "Add Category"} onClose={() => setFormVisible(false)}><View className="gap-4"><Field label="Name" icon="tag-outline"><TextInput className="h-12 flex-1 font-sans text-base text-text" onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Category name" placeholderTextColor={theme.colors.text.muted} value={form.name} /></Field><Text className="font-sans text-sm font-semibold text-text">Icon</Text><View className="flex-row flex-wrap gap-2">{categoryIcons.map((icon) => <IconSwatch icon={icon} key={icon} selected={form.icon === icon} onPress={() => setForm((current) => ({ ...current, icon }))} />)}</View><Text className="font-sans text-sm font-semibold text-text">Color</Text><View className="flex-row flex-wrap gap-2">{categoryPalette.map((color) => <Pressable accessibilityRole="button" accessibilityState={{ selected: form.color === color }} className={`h-10 w-10 rounded-full border-2 ${form.color === color ? "border-brand-soft" : "border-surface-border"} ${categoryBgClass(color)}`} key={color} onPress={() => setForm((current) => ({ ...current, color }))} />)}</View><PrimaryButton disabled={saving} loading={saving} onPress={submitCategory}>Save</PrimaryButton></View></BottomSheet></BottomSheet>;
}

function MenuRow({ disabled = false, icon, label, suffix, onPress }: { disabled?: boolean; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; suffix?: string; onPress: () => void }) { return <Pressable accessibilityRole="button" className={`min-h-12 flex-row items-center gap-3 rounded-xl bg-surface px-4 py-3 ${disabled ? "opacity-50" : ""}`} disabled={disabled} onPress={onPress}><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} /><Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text">{label}</Text>{suffix ? <Text className="font-sans text-xs text-text-muted">{suffix}</Text> : null}</Pressable>; }
function ImageAction({ icon, label, sublabel, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; sublabel: string; onPress: () => void }) { return <Pressable accessibilityRole="button" className="min-h-14 flex-row items-center gap-3 rounded-xl border border-surface-border bg-background-muted px-3 py-2" onPress={onPress}><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} /><View className="min-w-0 flex-1"><Text className="font-sans text-sm font-semibold text-text">{label}</Text><Text className="font-sans text-xs text-text-muted">{sublabel}</Text></View><MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.muted} /></Pressable>; }
function Field({ children, error, icon, label }: { children: React.ReactNode; error?: string | undefined; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) { return <View className="gap-2 rounded-xl border border-surface-border bg-surface p-4"><Text className="font-sans text-base font-semibold text-text">{label}</Text><View className="flex-row items-center gap-3 rounded-xl border border-surface-border bg-background-muted px-3"><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />{children}</View>{error ? <Text className="font-sans text-xs font-semibold text-accent-rose">{error}</Text> : null}</View>; }
function PickerField({ error, icon, label, value, onPress }: { error?: string | undefined; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; onPress: () => void }) { return <View className="gap-2 rounded-xl border border-surface-border bg-surface p-4"><Text className="font-sans text-base font-semibold text-text">{label}</Text><Pressable accessibilityRole="button" className="h-12 flex-row items-center gap-3 rounded-xl border border-surface-border bg-background-muted px-3" onPress={onPress}><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} /><Text className="min-w-0 flex-1 font-sans text-base text-text">{value}</Text><MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} /></Pressable>{error ? <Text className="font-sans text-xs font-semibold text-accent-rose">{error}</Text> : null}</View>; }
function CategoryPickerSheet({ categories, selectedId, visible, onClose, onSelect }: { categories: WishlistCategoryApi[]; selectedId: number | null; visible: boolean; onClose: () => void; onSelect: (category: WishlistCategoryApi) => void }) { const [search, setSearch] = useState(""); const rows = categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase())); return <BottomSheet visible={visible} title="Choose Category" onClose={onClose}><View className="gap-3"><View className="h-12 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-3"><MaterialCommunityIcons name="magnify" size={theme.icons.sm} color={theme.colors.text.muted} /><TextInput className="flex-1 font-sans text-base text-text" onChangeText={setSearch} placeholder="Search categories..." placeholderTextColor={theme.colors.text.muted} value={search} /></View>{rows.map((category) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedId === category.id }} className="min-h-12 flex-row items-center gap-3 rounded-xl bg-surface px-3 py-2" key={category.id} onPress={() => onSelect(category)}><MaterialCommunityIcons name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.sm} color={theme.colors.brand.soft} /><Text className="flex-1 font-sans text-sm font-semibold text-text">{category.name}</Text>{selectedId === category.id ? <MaterialCommunityIcons name="check" size={theme.icons.sm} color={theme.colors.state.success} /> : null}</Pressable>)}</View></BottomSheet>; }
function ImageUrlSheet({ value, visible, onClose, onRemove, onUse }: { value: string; visible: boolean; onClose: () => void; onRemove: () => void; onUse: (url: string) => void }) {
  const [url, setUrl] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setUrl(value), [value, visible]);
  return <BottomSheet visible={visible} title="Image URL" onClose={onClose}><View className="gap-4"><TextInput autoCapitalize="none" className="h-12 rounded-xl border border-surface-border bg-surface px-4 font-sans text-base text-text" onChangeText={setUrl} placeholder="https://example.com/image.jpg" placeholderTextColor={theme.colors.text.muted} value={url} />{url ? <Image source={{ uri: url }} className="h-40 rounded-xl bg-surface" resizeMode="cover" /> : null}<View className="flex-row gap-3"><SecondaryButton className="flex-1" onPress={onClose}>Cancel</SecondaryButton><SecondaryButton className="flex-1" onPress={onRemove}>Remove</SecondaryButton><PrimaryButton className="flex-1" onPress={() => onUse(url)}>Use Image</PrimaryButton></View></View></BottomSheet>;
}function IconButton({ icon, label, tone = "brand", onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; tone?: "brand" | "danger"; onPress: () => void }) { return <Pressable accessibilityLabel={label} accessibilityRole="button" className={`h-11 w-11 items-center justify-center rounded-full ${tone === "danger" ? "bg-accent-rose/10" : "bg-brand/10"}`} onPress={onPress}><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={tone === "danger" ? theme.colors.accent.rose : theme.colors.brand.soft} /></Pressable>; }
function IconSwatch({ icon, selected, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} className={`h-11 w-11 items-center justify-center rounded-xl border ${selected ? "border-brand-soft bg-brand/20" : "border-surface-border bg-surface"}`} onPress={onPress}><MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} /></Pressable>; }
function priorityColor(priority: WishlistPriorityApi) { if (priority === "HIGH") return theme.colors.accent.rose; if (priority === "MEDIUM") return theme.colors.accent.gold; return theme.colors.brand.soft; }
function prioritySelectedClass(priority: WishlistPriorityApi) { if (priority === "HIGH") return "border-accent-rose bg-accent-rose/10"; if (priority === "MEDIUM") return "border-accent-gold bg-accent-gold/10"; return "border-brand-soft bg-brand/10"; }
function categoryBgClass(color: string) { if (color === "blue") return "bg-blue-500/30"; if (color === "green") return "bg-state-success/25"; if (color === "gold") return "bg-accent-gold/25"; if (color === "pink") return "bg-accent-rose/25"; if (color === "teal") return "bg-cyan-500/25"; return "bg-brand/30"; }

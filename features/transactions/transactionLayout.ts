export const transactionLayout = {
  pageClassName: "flex-1 gap-0 px-4 pb-0 pt-0",
  chipRowClassName: "flex-row gap-2 pr-4",
  dateHeaderClassName: "mt-5 flex-row items-center justify-between pb-1",
  listContentClassName: "pb-28",
  rowContainerClassName: "",
  sectionFooterDividerClassName: "mt-1 h-px bg-surface-border/70",
  transactionCardClassName: "min-h-[76px] justify-center py-3.5",
  transactionRowContentClassName: "flex-row items-center",
  sharedBadgeClassName: "rounded-full border border-brand-muted bg-brand-deep/50 px-1.5 py-0.5",
  accountMetaClassName: "mt-1 flex-row items-center gap-1",
  balanceMetaClassName: "mt-0.5 font-sans text-[11px] text-text-muted",
  bottomPaddingClassName: "pb-28"
} as const;

export const transactionSpacing = {
  amountColumnMaxWidth: 128,
  bottomContentPadding: 112,
  chipGap: 8,
  chipHorizontalPadding: 12,
  chevronGap: 8,
  chevronWidth: 18,
  iconContainerSize: 44,
  iconToContentGap: 12,
  pageHorizontalPadding: 16,
  rowVerticalPadding: 14,
  sharedBadgeApproxWidth: 52
} as const;

export function transactionWidthRules(width: number) {
  const contentWidth = Math.max(0, width - transactionSpacing.pageHorizontalPadding * 2);

  return {
    amountColumnMaxWidth: Math.min(transactionSpacing.amountColumnMaxWidth, Math.max(96, Math.floor(contentWidth * 0.36))),
    contentWidth,
    pageHorizontalPadding: transactionSpacing.pageHorizontalPadding,
    rowUsesFullContentWidth: true
  };
}

export function transactionRowWidthRules(width: number, options: { hasSharedBadge?: boolean } = {}) {
  const rules = transactionWidthRules(width);
  const fixedRowWidth =
    transactionSpacing.iconContainerSize +
    transactionSpacing.iconToContentGap +
    rules.amountColumnMaxWidth +
    transactionSpacing.chevronGap +
    transactionSpacing.chevronWidth;
  const middleColumnWidth = Math.max(0, rules.contentWidth - fixedRowWidth);
  const titleWidth = Math.max(0, middleColumnWidth - (options.hasSharedBadge ? transactionSpacing.sharedBadgeApproxWidth + transactionSpacing.chipGap : 0));

  return {
    amountColumnMaxWidth: rules.amountColumnMaxWidth,
    balanceSharesAmountColumn: true,
    middleColumnWidth,
    productionDebugOverlayEnabled: false,
    titleWidth
  };
}

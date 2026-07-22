const BASE_TAB_BAR_HEIGHT = 76;
const BASE_TAB_BAR_PADDING_BOTTOM = 14;
const BASE_FAB_BOTTOM = 28;

export function bottomTabMetrics(bottomInset: number) {
  const safeBottom = Math.max(0, bottomInset);

  return {
    fabBottom: BASE_FAB_BOTTOM + safeBottom,
    tabBarHeight: BASE_TAB_BAR_HEIGHT + safeBottom,
    tabBarPaddingBottom: BASE_TAB_BAR_PADDING_BOTTOM + safeBottom
  };
}

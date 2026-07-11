export const colors = {
  background: {
    DEFAULT: "#08060D",
    elevated: "#100B19",
    inset: "#050409",
    muted: "#17101F"
  },
  surface: {
    DEFAULT: "#120D1C",
    raised: "#1A1128",
    pressed: "#221631",
    border: "#332044"
  },
  brand: {
    DEFAULT: "#8B5CF6",
    soft: "#A78BFA",
    muted: "#4C1D95",
    deep: "#2E1065"
  },
  accent: {
    gold: "#F3C969",
    emerald: "#34D399",
    rose: "#FB7185",
    cyan: "#67E8F9"
  },
  text: {
    DEFAULT: "#F8F4FF",
    muted: "#B8AFC7",
    subtle: "#82758F",
    inverse: "#08060D"
  },
  state: {
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#38BDF8"
  },
  transparent: "transparent"
} as const;

export const spacing = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px"
} as const;

export const radius = {
  none: "0",
  sm: "4px",
  DEFAULT: "8px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  full: "999px"
} as const;

export const typography = {
  fontFamily: {
    sans: ["System"]
  },
  fontSize: {
    xs: ["12px", { lineHeight: "16px" }],
    sm: ["14px", { lineHeight: "20px" }],
    base: ["16px", { lineHeight: "24px" }],
    lg: ["18px", { lineHeight: "26px" }],
    xl: ["22px", { lineHeight: "30px" }],
    "2xl": ["28px", { lineHeight: "36px" }]
  }
} as const;

export const shadows = {
  glow: "0 0 24px rgba(139, 92, 246, 0.28)",
  card: "0 18px 48px rgba(0, 0, 0, 0.32)"
} as const;

export const elevation = {
  none: 0,
  sm: 2,
  md: 6,
  lg: 12
} as const;

export const animation = {
  fast: 160,
  base: 240,
  slow: 360
} as const;

export const icons = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28
} as const;

export const theme = {
  animation,
  colors,
  elevation,
  icons,
  radius,
  shadows,
  spacing,
  typography
} as const;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof colors;

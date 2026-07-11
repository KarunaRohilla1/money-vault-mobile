import rawTokens = require("./tokens");

export const theme = rawTokens;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof theme.colors;

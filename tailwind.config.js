require("ts-node/register/transpile-only");

const { colors, radius, spacing, typography, shadows } = require("./theme/tokens.ts");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: radius,
      spacing,
      fontSize: typography.fontSize,
      fontFamily: typography.fontFamily,
      boxShadow: shadows
    }
  },
  plugins: []
};

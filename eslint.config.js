const expoConfig = require("eslint-config-expo/flat");
const reactNativePlugin = require("eslint-plugin-react-native");

module.exports = [
  ...expoConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-native": reactNativePlugin
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/export": "off",
      "import/namespace": "off",
      "import/no-duplicates": "off",
      "import/no-unresolved": "off",
      "react-native/no-inline-styles": "error"
    }
  }
];

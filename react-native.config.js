const isProduction =
  (process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development") === "production";

module.exports = {
  dependencies: isProduction
    ? {
        "expo-dev-client": {
          platforms: {
            android: null,
            ios: null
          }
        }
      }
    : {}
};

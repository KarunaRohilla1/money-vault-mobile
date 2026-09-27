const PRODUCTION_API_BASE_URL = "https://money-vault-api-316223429546.asia-south1.run.app";
const LOCAL_API_HOST_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/u;

function appEnvironment() {
  return process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development";
}

function isLocalApiBaseUrl(value) {
  try {
    return LOCAL_API_HOST_PATTERN.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

function resolveApiBaseUrl(environment) {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (configuredUrl) {
    if (environment === "production" && isLocalApiBaseUrl(configuredUrl)) {
      throw new Error("Production builds cannot use a localhost, emulator, or LAN API base URL.");
    }

    return configuredUrl;
  }

  if (environment === "production") {
    return PRODUCTION_API_BASE_URL;
  }

  throw new Error("EXPO_PUBLIC_API_BASE_URL is required for development builds.");
}

module.exports = ({ config }) => {
  const environment = appEnvironment();
  const apiBaseUrl = resolveApiBaseUrl(environment);
  const isProduction = environment === "production";
  const usesLocalApi = isLocalApiBaseUrl(apiBaseUrl);

  const plugins = [
    ...(isProduction ? [] : ["expo-dev-client"]),
    ...(config.plugins ?? []),
    ...(!isProduction && usesLocalApi
      ? [
          [
            "expo-build-properties",
            {
              android: {
                usesCleartextTraffic: true
              }
            }
          ]
        ]
      : [])
  ];

  return {
    ...config,
    plugins,
    ios: {
      ...(config.ios ?? {}),
      infoPlist: {
        ...((config.ios && config.ios.infoPlist) || {}),
        NSAppTransportSecurity: {
          ...(((config.ios && config.ios.infoPlist && config.ios.infoPlist.NSAppTransportSecurity) || {})),
          NSAllowsLocalNetworking: true,
          ...(isProduction || !usesLocalApi
            ? {}
            : {
                NSAllowsArbitraryLoads: true
              })
        }
      }
    },
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl,
      appEnvironment: environment
    }
  };
};

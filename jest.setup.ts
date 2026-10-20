import { queryClient } from "@/lib/queryClient";

jest.setTimeout(10000);

process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.money-vault.test";

jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn()
  },
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: "active"
  },
  Linking: {
    openSettings: jest.fn(async () => undefined)
  },
  Platform: {
    OS: "ios",
    select: (spec: Record<string, unknown>) => spec.ios ?? spec.default
  },
  Share: {
    share: jest.fn(async () => ({ action: "sharedAction" }))
  },
  StyleSheet: {
    create: (styles: unknown) => styles
  }
}));

jest.mock("expo", () => ({
  isRunningInExpoGo: jest.fn(() => false)
}));

jest.mock("expo-router", () => ({
  router: {
    dismissAll: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  },
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({
    dismissAll: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })),
  useSegments: jest.fn(() => [])
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {}
    }
  }
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => `hash:${value}`)
}));

jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  isAvailableAsync: jest.fn(async () => true),
  setItemAsync: jest.fn(async () => undefined)
}));

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn(async () => ({ success: true })),
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true)
}));

jest.mock("expo-clipboard", () => ({
  getStringAsync: jest.fn(async () => ""),
  setStringAsync: jest.fn(async () => undefined)
}));

jest.mock("expo-image-picker", () => ({
  PermissionStatus: {
    DENIED: "denied",
    GRANTED: "granted",
    UNDETERMINED: "undetermined"
  },
  launchImageLibraryAsync: jest.fn(async () => ({
    assets: [{ uri: "file:///mock/image.jpg" }],
    canceled: false
  })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    granted: true,
    status: "granted"
  }))
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("DateTimePicker")
  };
});

jest.mock("@react-native-async-storage/async-storage", () => {
  const storage = new Map<string, string>();

  return {
    getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    })
  };
});

afterEach(() => {
  queryClient.clear();
});

afterAll(() => {
  queryClient.clear();
});

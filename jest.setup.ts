import { queryClient } from "@/lib/queryClient";

jest.setTimeout(10000);

process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.money-vault.test";

jest.mock("react-native", () => ({
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

const notificationsMock = {
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 2 },
  SchedulableTriggerInputTypes: { DATE: "date" },
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ canAskAgain: true, granted: true, status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ canAskAgain: true, granted: true, status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => "notification-id"),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn()
};

jest.mock("expo-notifications", () => notificationsMock);

jest.mock("expo-clipboard", () => ({
  getStringAsync: jest.fn(async () => ""),
  setStringAsync: jest.fn(async () => undefined)
}));

jest.mock("@/features/notifications/services/nativeNotifications", () => ({
  Notifications: notificationsMock
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

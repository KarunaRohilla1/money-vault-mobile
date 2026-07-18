import { queryClient } from "@/lib/queryClient";

jest.setTimeout(10000);

process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.money-vault.test";

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

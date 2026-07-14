import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "money-vault:backend-auth-token";

export function getStoredAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
  return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
